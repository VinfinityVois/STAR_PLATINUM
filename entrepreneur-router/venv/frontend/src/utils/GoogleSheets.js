class GoogleSheetsIntegration {
    constructor() {
        this.spreadsheetId = '1QuV3AVfa70RkyPfcvVDFzw6ZhdzGyKK0taefOwKOTao';
        this.apiKey = 'YOUR_API_KEY'; // Нужно получить в Google Cloud Console
        this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    }

    async loadData(range = 'A:H') {
        try {
            const url = `${this.baseUrl}/${this.spreadsheetId}/values/${range}?key=${this.apiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            
            return this.parseSheetData(data.values);
        } catch (error) {
            console.error('Ошибка загрузки данных из Google Sheets:', error);
            return this.loadDemoData(); // Fallback на демо-данные
        }
    }

    parseSheetData(sheetData) {
        if (!sheetData || sheetData.length < 2) return [];
        
        const headers = sheetData[0];
        const rows = sheetData.slice(1);
        
        return rows.map((row, index) => {
            return {
                id: parseInt(row[0]) || index + 1,
                address: row[1] || '',
                latitude: parseFloat(row[2]) || 0,
                longitude: parseFloat(row[3]) || 0,
                workStart: row[4] || '09:00',
                workEnd: row[5] || '18:00',
                lunchStart: row[6] || '13:00',
                lunchEnd: row[7] || '14:00'
            };
        }).filter(item => item.address.trim() !== '');
    }

    loadDemoData() {
        // Демо-данные на основе вашей таблицы
        return [
            {
                id: 1,
                address: "344011, г. Ростов-на-Дону, ул. Большая Садовая, д. 1",
                latitude: 47.221532,
                longitude: 39.704423,
                workStart: "09:00",
                workEnd: "18:00",
                lunchStart: "13:00",
                lunchEnd: "14:00"
            },
            {
                id: 2,
                address: "344012, г. Ростов-на-Дону, пр. Буденновский, д. 15",
                latitude: 47.228945,
                longitude: 39.718762,
                workStart: "09:00",
                workEnd: "18:00",
                lunchStart: "13:00",
                lunchEnd: "14:00"
            },
            // ... остальные адреса из таблицы
        ];
    }

    async exportToSheet(data) {
        // Функция для экспорта обратно в таблицу
        try {
            const values = data.map(item => [
                item.id,
                item.address,
                item.latitude,
                item.longitude,
                item.workStart,
                item.workEnd,
                item.lunchStart,
                item.lunchEnd
            ]);

            const body = {
                values: [headers, ...values]
            };

            // Здесь будет логика отправки данных обратно в Google Sheets
            console.log('Экспорт данных:', body);
        } catch (error) {
            console.error('Ошибка экспорта:', error);
        }
    }
}