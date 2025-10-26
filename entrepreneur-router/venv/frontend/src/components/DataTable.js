class DataTable {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(data) {
        if (!data.length) return;

        const table = document.createElement('table');
        table.className = 'data-table';
        
        const headers = ['ID', 'Адрес', 'Рабочее время', 'Обед', 'Координаты'];
        
        table.innerHTML = `
            <thead>
                <tr>
                    ${headers.map(header => `<th>${header}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${data.map(item => `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.address}</td>
                        <td>${item.workStart} - ${item.workEnd}</td>
                        <td>${item.lunchStart} - ${item.lunchEnd}</td>
                        <td>${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        this.container.innerHTML = '';
        this.container.appendChild(table);
    }
}