"""Risk Management Service.

Enforces pre-trade risk controls, position limits, loss thresholds,
cooldown periods, and emergency stops before any order is submitted.
"""

import datetime
import logging
import time
from typing import Dict, List, Optional
from app.config import Settings
from app.exchange.delta_client import DeltaClient
from app.schemas.trading import OrderSide, RiskDecision

logger = logging.getLogger("algopilot.risk_service")


class RiskService:
    """Pre-trade risk management engine.

    All trading decisions must pass through this validator.
    Fails closed: if any check fails or errors occur, the trade is rejected.
    """

    def __init__(self, settings: Settings, delta_client: Optional[DeltaClient] = None):
        self.settings = settings
        self.delta_client = delta_client

        # Internal safety state
        self._emergency_stop: bool = False
        self._daily_realized_loss: float = 0.0
        self._last_order_timestamps: Dict[str, float] = {}  # symbol -> timestamp
        self._order_cooldown_seconds: float = 10.0  # Min seconds between orders on same symbol

    @property
    def is_emergency_stop_active(self) -> bool:
        return self._emergency_stop

    def activate_emergency_stop(self, reason: str = "Operator manual emergency stop") -> None:
        """Immediately block all new orders."""
        self._emergency_stop = True
        logger.critical("EMERGENCY STOP ACTIVATED: %s", reason)

    def deactivate_emergency_stop(self) -> None:
        """Resume normal risk evaluation (manual operator override)."""
        self._emergency_stop = False
        logger.warning("EMERGENCY STOP DEACTIVATED by operator.")

    def record_loss(self, loss_amount: float) -> None:
        """Record realized loss towards daily limit."""
        if loss_amount > 0:
            self._daily_realized_loss += loss_amount
            logger.info("Recorded daily loss: $%.2f (Total daily loss: $%.2f)", loss_amount, self._daily_realized_loss)

    def reset_daily_loss(self) -> None:
        """Reset daily loss counter (typically at UTC 00:00)."""
        self._daily_realized_loss = 0.0

    def record_order_placed(self, symbol: str) -> None:
        """Record timestamp of placed order for cooldown tracking."""
        self._last_order_timestamps[symbol.upper()] = time.time()

    async def evaluate_trade(
        self,
        symbol: str,
        side: OrderSide,
        size: float,
        price: Optional[float] = None,
        current_position_size: float = 0.0,
        open_positions_count: int = 0,
        is_closing_position: bool = False,
    ) -> RiskDecision:
        """Perform comprehensive pre-trade risk evaluation."""
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        checks_passed: List[str] = []
        checks_failed: List[str] = []

        # Check 1: Emergency Stop Check
        if self._emergency_stop:
            checks_failed.append("Emergency stop is active")
            return self._build_decision(False, "Rejected: Emergency stop is currently active.", checks_passed, checks_failed, now_iso)
        checks_passed.append("Emergency stop inactive")

        # Check 2: Trading Enabled Switch
        if not self.settings.TRADING_ENABLED:
            checks_failed.append("TRADING_ENABLED configuration is false")
            return self._build_decision(
                False,
                "Rejected: Trading is disabled in configuration (TRADING_ENABLED=False).",
                checks_passed,
                checks_failed,
                now_iso,
            )
        checks_passed.append("Trading enabled in configuration")

        # Check 3: API Credentials presence
        if not self.settings.has_credentials:
            checks_failed.append("Exchange credentials missing")
            return self._build_decision(
                False,
                "Rejected: Delta Exchange API credentials are not configured.",
                checks_passed,
                checks_failed,
                now_iso,
            )
        checks_passed.append("Exchange credentials present")

        # Check 4: Base URL Testnet verification
        if "testnet" not in self.settings.DELTA_BASE_URL.lower():
            checks_failed.append("DELTA_BASE_URL is not a testnet endpoint")
            return self._build_decision(
                False,
                "Rejected: Safety violation: Live trading base URL detected.",
                checks_passed,
                checks_failed,
                now_iso,
            )
        checks_passed.append("Testnet endpoint confirmed")

        # Check 5: Daily Loss Threshold
        if self._daily_realized_loss >= self.settings.MAX_DAILY_LOSS:
            checks_failed.append(
                f"Daily loss limit reached (${self._daily_realized_loss:.2f} >= ${self.settings.MAX_DAILY_LOSS:.2f})"
            )
            return self._build_decision(
                False,
                f"Rejected: Maximum daily loss limit reached (${self._daily_realized_loss:.2f} >= ${self.settings.MAX_DAILY_LOSS:.2f}).",
                checks_passed,
                checks_failed,
                now_iso,
            )
        checks_passed.append(f"Daily loss within threshold (${self._daily_realized_loss:.2f} < ${self.settings.MAX_DAILY_LOSS:.2f})")

        # Check 6: Order Quantity Limits
        if size <= 0:
            checks_failed.append("Order size must be strictly positive")
            return self._build_decision(False, "Rejected: Order size must be greater than zero.", checks_passed, checks_failed, now_iso)

        if size > self.settings.MAX_POSITION_SIZE:
            checks_failed.append(
                f"Order size {size} exceeds MAX_POSITION_SIZE ({self.settings.MAX_POSITION_SIZE})"
            )
            return self._build_decision(
                False,
                f"Rejected: Order size {size} exceeds max position size limit ({self.settings.MAX_POSITION_SIZE}).",
                checks_passed,
                checks_failed,
                now_iso,
            )
        checks_passed.append(f"Order size {size} within limit ({self.settings.MAX_POSITION_SIZE})")

        # Check 7: Position Size and Open Position Limits (Only for opening/adding trades)
        if not is_closing_position:
            # Check maximum concurrent open positions
            if current_position_size == 0 and open_positions_count >= self.settings.MAX_OPEN_POSITIONS:
                checks_failed.append(
                    f"Max open positions reached ({open_positions_count} >= {self.settings.MAX_OPEN_POSITIONS})"
                )
                return self._build_decision(
                    False,
                    f"Rejected: Maximum simultaneous open positions reached ({open_positions_count}).",
                    checks_passed,
                    checks_failed,
                    now_iso,
                )
            checks_passed.append(f"Open positions count ({open_positions_count}) within limit")

            # Check resulting aggregate position size
            new_total_size = abs(current_position_size) + size
            if new_total_size > self.settings.MAX_POSITION_SIZE:
                checks_failed.append(
                    f"New aggregate position size {new_total_size} exceeds limit {self.settings.MAX_POSITION_SIZE}"
                )
                return self._build_decision(
                    False,
                    f"Rejected: Cumulative position size {new_total_size} would exceed limit {self.settings.MAX_POSITION_SIZE}.",
                    checks_passed,
                    checks_failed,
                    now_iso,
                )
            checks_passed.append("Cumulative position size within limit")

        # Check 8: Duplicate Order / Cooldown Safeguard
        sym_upper = symbol.upper()
        last_time = self._last_order_timestamps.get(sym_upper, 0.0)
        elapsed = time.time() - last_time
        if elapsed < self._order_cooldown_seconds:
            remaining = self._order_cooldown_seconds - elapsed
            checks_failed.append(f"Cooldown active: {remaining:.1f}s remaining")
            return self._build_decision(
                False,
                f"Rejected: Duplicate order safeguard. Cooldown active for {sym_upper} ({remaining:.1f}s remaining).",
                checks_passed,
                checks_failed,
                now_iso,
            )
        checks_passed.append("Order cooldown check passed")

        # Check 9: Exchange Connectivity (optional live check if client available)
        if self.delta_client:
            try:
                healthy, _ = await self.delta_client.ping_health()
                if not healthy:
                    checks_failed.append("Exchange connectivity ping reported unhealthy")
                    return self._build_decision(
                        False,
                        "Rejected: Delta Exchange Testnet is currently unreachable or reporting errors.",
                        checks_passed,
                        checks_failed,
                        now_iso,
                    )
                checks_passed.append("Exchange connectivity healthy")
            except Exception as exc:
                checks_failed.append(f"Exchange ping exception: {str(exc)}")
                return self._build_decision(
                    False,
                    f"Rejected: Failed to verify exchange connectivity: {str(exc)}",
                    checks_passed,
                    checks_failed,
                    now_iso,
                )

        return self._build_decision(
            True,
            "Approved: All pre-trade risk controls passed.",
            checks_passed,
            checks_failed,
            now_iso,
        )

    def _build_decision(
        self,
        approved: bool,
        reason: str,
        checks_passed: List[str],
        checks_failed: List[str],
        timestamp: str,
    ) -> RiskDecision:
        decision = RiskDecision(
            approved=approved,
            reason=reason,
            checks_passed=checks_passed,
            checks_failed=checks_failed,
            timestamp=timestamp,
        )
        if approved:
            logger.info("Risk check APPROVED: %s", reason)
        else:
            logger.warning("Risk check REJECTED: %s", reason)
        return decision
