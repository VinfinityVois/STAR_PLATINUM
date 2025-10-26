class Map2GIS {
    constructor(containerId, apiKey = null) {
        this.containerId = containerId;
        this.apiKey = apiKey;
        this.map = null;
        this.markers = [];
        this.routeLayer = null;
        this.currentRouteType = 'car';
        
        this.initMap();
    }

    async initMap() {
        try {
            // Инициализация карты 2ГИС
            DG.then(() => {
                this.map = DG.map(this.containerId, {
                    center: [47.221532, 39.704423],
                    zoom: 12,
                    minZoom: 10,
                    maxZoom: 18
                });

                // Добавляем слой транспортной ситуации
                DG.traffic.addTo(this.map);

                // Добавляем контроль масштаба
                DG.control.zoom({ position: 'topright' }).addTo(this.map);
                DG.control.scale().addTo(this.map);

                console.log('2GIS карта успешно инициализирована');
            });
        } catch (error) {
            console.error('Ошибка инициализации 2GIS карты:', error);
        }
    }

    // Добавление маркера с номером
    addMarker(pointData, index) {
        if (!this.map) return null;

        // Создаем кастомную иконку с номером
        const iconHtml = `
            <div class="custom-marker" style="
                background: ${pointData.clientLevel === 'VIP' ? '#f59e0b' : '#3b82f6'};
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">
                ${index + 1}
            </div>
        `;

        const marker = DG.marker([pointData.latitude, pointData.longitude], {
            icon: DG.divIcon({
                html: iconHtml,
                className: 'custom-marker-container',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            })
        })
        .addTo(this.map)
        .bindPopup(`
            <div class="map-popup">
                <h4>Точка #${index + 1}</h4>
                <p><strong>Адрес:</strong> ${pointData.address}</p>
                <p><strong>Время работы:</strong> ${pointData.workStart} - ${pointData.workEnd}</p>
                <p><strong>Уровень:</strong> ${pointData.clientLevel}</p>
                <p><strong>Порядок посещения:</strong> ${index + 1}</p>
            </div>
        `);

        this.markers.push({
            id: pointData.id,
            marker: marker,
            data: pointData,
            index: index
        });

        return marker;
    }

    // Обновление точек на карте с правильной нумерацией
    updatePoints(pointsData) {
        this.clearMarkers();
        
        pointsData.forEach((point, index) => {
            this.addMarker(point, index);
        });

        // Автоматическое подстраивание границ карты
        if (pointsData.length > 0) {
            this.fitToMarkers();
        }
    }

    // Очистка всех маркеров
    clearMarkers() {
        this.markers.forEach(item => {
            this.map.removeLayer(item.marker);
        });
        this.markers = [];
    }

    // Подстройка карты под все маркеры
    fitToMarkers() {
        if (this.markers.length === 0) return;

        const group = DG.featureGroup(this.markers.map(item => item.marker));
        this.map.fitBounds(group.getBounds(), { padding: [20, 20] });
    }

    // Построение маршрута между точками с правильным типом транспорта
    async buildRoute(points, routeType = 'car') {
        if (points.length < 2) {
            console.log('Недостаточно точек для построения маршрута');
            return;
        }

        // Сохраняем тип маршрута
        this.currentRouteType = routeType;

        // Удаляем предыдущий маршрут
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
        }

        try {
            const waypoints = points.map(point => 
                DG.latLng(point.latitude, point.longitude)
            );

            console.log('Построение маршрута для точек:', points.length, 'тип:', routeType);

            // Используем маршрутизатор 2ГИС с правильным типом транспорта
            const routingOptions = {
                color: '#3b82f6',
                weight: 6,
                opacity: 0.8,
                fillOpacity: 0.3
            };

            // Настраиваем параметры в зависимости от типа транспорта
            switch (routeType) {
                case 'car':
                    routingOptions.color = '#3b82f6';
                    routingOptions.routeType = 'car';
                    break;
                case 'public':
                    routingOptions.color = '#10b981';
                    routingOptions.routeType = 'bus';
                    break;
                case 'walking':
                    routingOptions.color = '#8b5cf6';
                    routingOptions.routeType = 'pedestrian';
                    break;
                default:
                    routingOptions.routeType = 'car';
            }

            this.routeLayer = DG.routing.route(waypoints, routingOptions).addTo(this.map);

            // Обработка завершения построения маршрута
            this.routeLayer.on('routesfound', (e) => {
                console.log('Маршрут построен успешно:', e.routes);
                if (e.routes && e.routes.length > 0) {
                    const route = e.routes[0];
                    console.log('Длина маршрута:', route.summary?.totalDistance, 'м');
                    console.log('Время маршрута:', route.summary?.totalTime, 'сек');
                    
                    // Подстраиваем карту под маршрут
                    this.map.fitBounds(this.routeLayer.getBounds(), { padding: [50, 50] });
                }
            });

            // Обработка ошибок маршрутизации
            this.routeLayer.on('routingerror', (e) => {
                console.error('Ошибка построения маршрута:', e.error);
                this.showFallbackRoute(points);
            });

            return this.routeLayer;

        } catch (error) {
            console.error('Ошибка построения маршрута:', error);
            this.showFallbackRoute(points);
        }
    }

    // Простая линия маршрута (запасной вариант)
    showFallbackRoute(points) {
        console.log('Используем запасной метод построения маршрута');

        const routePoints = points.map(point => 
            [point.latitude, point.longitude]
        );

        this.routeLayer = DG.polyline(routePoints, {
            color: this.getRouteColor(this.currentRouteType),
            weight: 4,
            opacity: 0.7,
            smoothFactor: 1,
            dashArray: '5, 10'
        }).addTo(this.map);

        this.map.fitBounds(this.routeLayer.getBounds(), { padding: [30, 30] });
    }

    // Получение цвета маршрута в зависимости от типа транспорта
    getRouteColor(routeType) {
        const colors = {
            'car': '#3b82f6',
            'public': '#10b981', 
            'walking': '#8b5cf6'
        };
        return colors[routeType] || '#3b82f6';
    }

    // Фокус на конкретную точку
    focusOnPoint(pointId) {
        const markerItem = this.markers.find(item => item.id === pointId);
        if (markterItem) {
            this.map.setView(
                [markerItem.data.latitude, markerItem.data.longitude], 
                15
            );
            markerItem.marker.openPopup();
        }
    }

    // Поиск адреса через 2ГИС
    async searchAddress(query) {
        return new Promise((resolve) => {
            DG.geocode(query, (result) => {
                if (result && result.items && result.items.length > 0) {
                    resolve(result.items[0]);
                } else {
                    resolve(null);
                }
            });
        });
    }

    // Получение координат по адресу
    async geocodeAddress(address) {
        try {
            const result = await this.searchAddress(address);
            if (result) {
                return {
                    latitude: result.point.lat,
                    longitude: result.point.lon,
                    address: result.name
                };
            }
            return null;
        } catch (error) {
            console.error('Ошибка геокодирования:', error);
            return null;
        }
    }

    // Удаление маршрута
    clearRoute() {
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
            this.routeLayer = null;
        }
    }

    // Изменение типа карты
    setMapType(type = 'standard') {
        const types = {
            standard: DG.layer.standard(),
            satellite: DG.layer.satellite(),
            hybrid: DG.layer.hybrid()
        };

        if (types[type]) {
            this.map.addLayer(types[type]);
        }
    }

    // Получение текущего центра карты
    getCenter() {
        return this.map.getCenter();
    }

    // Получение текущего масштаба
    getZoom() {
        return this.map.getZoom();
    }

    // Обновление позиции маркеров (для перетаскивания)
    updateMarkerPositions(pointsData) {
        pointsData.forEach((point, index) => {
            const markerItem = this.markers.find(item => item.id === point.id);
            if (markerItem) {
                // Обновляем позицию маркера
                markerItem.marker.setLatLng([point.latitude, point.longitude]);
                
                // Обновляем номер в иконке
                const newIconHtml = `
                    <div class="custom-marker" style="
                        background: ${point.clientLevel === 'VIP' ? '#f59e0b' : '#3b82f6'};
                        color: white;
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 14px;
                        border: 3px solid white;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    ">
                        ${index + 1}
                    </div>
                `;
                
                markerItem.marker.setIcon(DG.divIcon({
                    html: newIconHtml,
                    className: 'custom-marker-container',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                }));

                // Обновляем popup
                markerItem.marker.bindPopup(`
                    <div class="map-popup">
                        <h4>Точка #${index + 1}</h4>
                        <p><strong>Адрес:</strong> ${point.address}</p>
                        <p><strong>Время работы:</strong> ${point.workStart} - ${point.workEnd}</p>
                        <p><strong>Уровень:</strong> ${point.clientLevel}</p>
                        <p><strong>Порядок посещения:</strong> ${index + 1}</p>
                    </div>
                `);

                markerItem.index = index;
            }
        });
    }
}