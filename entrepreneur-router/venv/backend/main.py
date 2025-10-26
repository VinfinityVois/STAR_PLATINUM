from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import requests
import json

# Создаем приложение FastAPI
app = FastAPI(title="Entrepreneur Router")

# Разрешаем запросы от фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модель для входных данных
class RouteRequest(BaseModel):
    addresses: List[str]
    optimize_by: str = "time"  # "time" или "distance"

# Модель для точки маршрута
class RoutePoint(BaseModel):
    address: str
    order: int
    estimated_time: str
    distance: str

# Модель для ответа
class RouteResponse(BaseModel):
    optimized_route: List[RoutePoint]
    total_time: str
    total_distance: str
    message: str

@app.get("/")
async def root():
    return {"message": "Entrepreneur Router API работает!"}

@app.post("/calculate-route", response_model=RouteResponse)
async def calculate_route(request: RouteRequest):
    """
    Основной endpoint для расчета маршрута
    """
    try:
        # Здесь будет сложная логика с Яндекс.API и алгоритмами
        # Пока делаем простую заглушку
        
        if not request.addresses:
            raise HTTPException(status_code=400, detail="Список адресов пуст")
        
        # Простая логика - просто возвращаем адреса в том же порядке
        # но с "оптимизацией" для демонстрации
        optimized_route = []
        for i, address in enumerate(request.addresses):
            optimized_route.append({
                "address": address,
                "order": i + 1,
                "estimated_time": f"{i * 15} мин",
                "distance": f"{i * 2} км"
            })
        
        return {
            "optimized_route": optimized_route,
            "total_time": f"{len(request.addresses) * 15} мин",
            "total_distance": f"{len(request.addresses) * 2} км", 
            "message": "Маршрут построен успешно! (демо-версия)"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Entrepreneur Router"}

# Запуск сервера
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)