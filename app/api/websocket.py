"""WebSocket endpoint for broadcasting live Delta Exchange Demo market data."""

import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.market_streamer import MarketStreamer

logger = logging.getLogger("algopilot.api.websocket")

router = APIRouter(tags=["Market WebSocket"])


@router.websocket("/ws/market")
async def websocket_market_endpoint(websocket: WebSocket):
    """FastAPI WebSocket endpoint for live Delta Exchange market stream.
    
    Broadcasts normalized candlestick and ticker updates to connected browser clients.
    """
    streamer: MarketStreamer = websocket.app.state.market_streamer
    await streamer.register_client(websocket)
    try:
        while True:
            # Keep connection alive and listen for optional client pings/subscriptions
            data = await websocket.receive_text()
            # If client sends ping, respond with pong
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await streamer.unregister_client(websocket)
    except Exception as exc:
        logger.debug("Client WebSocket closed with error: %s", exc)
        await streamer.unregister_client(websocket)
