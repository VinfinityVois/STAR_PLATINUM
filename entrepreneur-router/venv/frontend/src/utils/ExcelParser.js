class ExcelParser {
    constructor() {
        this.workbook = null;
    }

    async parseExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    this.workbook = XLSX.read(data, { type: 'array' });
                    
                    // Получаем данные из первого листа
                    const firstSheet = this.workbook.Sheets[this.workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                    
                    const parsedData = this.parseSheetData(jsonData);
                    resolve(parsedData);
                } catch (error) {
                    console.error('Ошибка парсинга Excel:', error);
                    reject(new Error(`Ошибка парсинга Excel: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                console.error('Ошибка чтения файла');
                reject(new Error('Ошибка чтения файла'));
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // В методе parseSheetData обновим парсинг обеденного времени
parseSheetData(sheetData) {
    if (!sheetData || sheetData.length < 2) {
        console.warn('Файл не содержит данных или имеет неправильный формат');
        return this.getDemoData();
    }
    
    const headers = sheetData[0].map(h => h ? h.toString().toLowerCase().trim() : '');
    const rows = sheetData.slice(1).filter(row => row && row.length > 0);
    
    console.log('Заголовки файла:', headers);
    console.log('Строки данных:', rows);
    
    return rows.map((row, index) => {
        try {
            // Автоматическое определение структуры данных
            const addressIndex = this.findColumnIndex(headers, ['адрес', 'address', 'точка']);
            const latIndex = this.findColumnIndex(headers, ['широта', 'latitude', 'lat']);
            const lngIndex = this.findColumnIndex(headers, ['долгота', 'longitude', 'lng', 'lon']);
            const workStartIndex = this.findColumnIndex(headers, ['начало работы', 'workstart', 'время начала']);
            const workEndIndex = this.findColumnIndex(headers, ['конец работы', 'workend', 'время окончания']);
            const lunchStartIndex = this.findColumnIndex(headers, ['начало обеда', 'lunchstart', 'обед начало']);
            const lunchEndIndex = this.findColumnIndex(headers, ['конец обеда', 'lunchend', 'обед конец']);
            const clientLevelIndex = this.findColumnIndex(headers, ['уровень', 'level', 'клиент', 'client']);
            
            // Безопасное получение значений
            const address = row[addressIndex] ? row[addressIndex].toString().trim() : `Точка ${index + 1}`;
            const latitude = this.parseCoordinate(row[latIndex]);
            const longitude = this.parseCoordinate(row[lngIndex]);
            
            const item = {
                id: index + 1,
                address: address,
                latitude: latitude || this.generateDemoCoord(47.22, 47.24),
                longitude: longitude || this.generateDemoCoord(39.70, 39.72),
                workStart: this.parseTime(row[workStartIndex]) || '09:00',
                workEnd: this.parseTime(row[workEndIndex]) || '18:00',
                lunchStart: this.parseTime(row[lunchStartIndex]) || '13:00', // Берем из файла
                lunchEnd: this.parseTime(row[lunchEndIndex]) || '14:00',     // Берем из файла
                clientLevel: this.parseClientLevel(row[clientLevelIndex]) || (Math.random() > 0.7 ? 'VIP' : 'Standart'),
                duration: Math.floor(Math.random() * 30) + 15,
                priority: Math.floor(Math.random() * 3) + 1
            };

            return item;
        } catch (error) {
            console.error('Ошибка парсинга строки:', row, error);
            return null;
        }
    }).filter(item => item !== null && item.address && item.address.trim() !== '');
}

// Обновим метод findColumnIndex для поиска обеденного времени
findColumnIndex(headers, possibleNames) {
    for (let name of possibleNames) {
        const index = headers.findIndex(h => h && h.includes(name));
        if (index !== -1) return index;
    }
    return -1; // Возвращаем -1 если колонка не найдена
}

    findColumnIndex(headers, possibleNames) {
        for (let name of possibleNames) {
            const index = headers.findIndex(h => h && h.includes(name));
            if (index !== -1) return index;
        }
        return 0;
    }

    parseCoordinate(coord) {
        if (!coord && coord !== 0) return null;
        const num = parseFloat(coord);
        return isNaN(num) ? null : num;
    }

    parseTime(timeValue) {
        if (!timeValue) return null;
        
        try {
            const timeStr = timeValue.toString().trim();
            
            // Пытаемся распарсить время в разных форматах
            if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
                return timeStr;
            }
            
            const timeMatch = timeStr.match(/(\d{1,2})[:\s]?(\d{2})?/);
            if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                let minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
                
                if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                }
            }
        } catch (error) {
            console.error('Ошибка парсинга времени:', timeValue, error);
        }
        return null;
    }

    parseClientLevel(levelValue) {
        if (!levelValue) return null;
        
        try {
            const levelStr = levelValue.toString().toLowerCase();
            if (levelStr.includes('vip') || levelStr.includes('важный') || levelStr.includes('высокий')) {
                return 'VIP';
            }
            if (levelStr.includes('standard') || levelStr.includes('стандарт') || levelStr.includes('обычный')) {
                return 'Standart';
            }
        } catch (error) {
            console.error('Ошибка парсинга уровня клиента:', levelValue, error);
        }
        return null;
    }

    generateDemoCoord(min, max) {
        return Math.random() * (max - min) + min;
    }

    getDemoData() {
        return [
            {
                id: 1,
                address: "ул. Пушкинская, 154, Ростов-на-Дону",
                latitude: 47.222531,
                longitude: 39.718609,
                workStart: "09:00",
                workEnd: "18:00",
                lunchStart: "13:00",
                lunchEnd: "14:00",
                clientLevel: "VIP",
                duration: 45,
                priority: 1
            },
            {
                id: 2,
                address: "пр. Буденновский, 35, Ростов-на-Дону",
                latitude: 47.227887,
                longitude: 39.744678,
                workStart: "10:00",
                workEnd: "19:00",
                lunchStart: "13:00",
                lunchEnd: "14:00",
                clientLevel: "Standart",
                duration: 30,
                priority: 2
            },
            {
                id: 3,
                address: "ул. Большая Садовая, 115, Ростов-на-Дону",
                latitude: 47.221817,
                longitude: 39.731747,
                workStart: "09:30",
                workEnd: "17:30",
                lunchStart: "13:00",
                lunchEnd: "14:00",
                clientLevel: "VIP",
                duration: 60,
                priority: 1
            }
        ];
    }

    exportToExcel(data, filename = 'маршруты_оптимизация.xlsx') {
        try {
            // Преобразуем данные в формат для Excel
            const excelData = data.map(item => ({
                'ID': item.id,
                'Адрес': item.address,
                'Широта': item.latitude,
                'Долгота': item.longitude,
                'Начало работы': item.workStart,
                'Конец работы': item.workEnd,
                'Начало обеда': item.lunchStart,
                'Конец обеда': item.lunchEnd,
                'Уровень клиента': item.clientLevel,
                'Длительность (мин)': item.duration,
                'Приоритет': item.priority
            }));

            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Маршруты');
            
            // Создаем и скачиваем файл
            XLSX.writeFile(workbook, filename);
            
            return true;
        } catch (error) {
            console.error('Ошибка экспорта в Excel:', error);
            throw error;
        }
    }

    generateTemplate() {
        const templateData = [
            {
                'Адрес': 'г. Ростов-на-Дону, ул. Примерная, д. 1',
                'Широта': '47.221532',
                'Долгота': '39.704423', 
                'Начало работы': '09:00',
                'Конец работы': '18:00',
                'Уровень клиента': 'VIP',
                'Длительность (мин)': '45',
                'Приоритет': '1'
            },
            {
                'Адрес': 'г. Ростов-на-Дону, пр. Примерный, д. 25',
                'Широта': '47.228945',
                'Долгота': '39.718762',
                'Начало работы': '10:00',
                'Конец работы': '19:00',
                'Уровень клиента': 'Standart',
                'Длительность (мин)': '30',
                'Приоритет': '2'
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Точки маршрута');
        XLSX.writeFile(workbook, 'шаблон_для_импорта.xlsx');
    }
}