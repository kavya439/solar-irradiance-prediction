const areaData = {
    Nellore: { lat: 14.4426, lon: 79.9865, areas: ["Stonehousepet", "Vedayapalem", "Magunta Layout", "Balaji Nagar"] },
    Chennai: { lat: 13.0827, lon: 80.2707, areas: ["T Nagar", "Anna Nagar", "Velachery", "Tambaram"] },
    Hyderabad: { lat: 17.3850, lon: 78.4867, areas: ["Gachibowli", "Madhapur", "Kukatpally", "Ameerpet"] },
    Bangalore: { lat: 12.9716, lon: 77.5946, areas: ["Whitefield", "Indiranagar", "Electronic City", "Yelahanka"] },
    Vijayawada: { lat: 16.5062, lon: 80.6480, areas: ["Benz Circle", "Patamata", "Poranki", "Governorpet"] },
    Visakhapatnam: { lat: 17.6868, lon: 83.2185, areas: ["MVP Colony", "Gajuwaka", "Seethammadhara", "Rushikonda"] },
    Tirupati: { lat: 13.6288, lon: 79.4192, areas: ["Mangalam", "RC Road", "Renigunta"] },
    Guntur: { lat: 16.3067, lon: 80.4365, areas: ["Brodipet", "Lakshmipuram", "Pattabhipuram"] }
};

let currentLocation = "";
let myChart = null;

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0);
}

// Initialize Location Grid on Load
document.addEventListener("DOMContentLoaded", () => {
    const locGrid = document.getElementById('locGrid');
    if (!locGrid) return;
    
    locGrid.innerHTML = "";
    Object.keys(areaData).forEach(city => {
        const btn = document.createElement('button');
        btn.className = "btn-primary";
        btn.innerText = city;
        btn.onclick = () => {
            currentLocation = city;
            document.getElementById("locTitle").innerText = "📍 Region: " + city;
            const areaSelect = document.getElementById("area");
            areaSelect.innerHTML = '<option value="">Select Area</option>';
            areaData[city].areas.forEach(a => {
                const opt = document.createElement("option");
                opt.value = a; opt.textContent = a;
                areaSelect.appendChild(opt);
            });
            showPage('predict');
        };
        locGrid.appendChild(btn);
    });
});

async function runPrediction() {
    const area = document.getElementById("area").value;
    const date = document.getElementById("date").value;
    if (!area || !date) { alert("Please select area and date!"); return; }

    const status = document.getElementById("statusText");
    status.style.display = "block";
    status.innerHTML = "🧠 Training Local Neural Network...";

    try {
        const coords = areaData[currentLocation];
        const timeInput = document.getElementById("time").value;
        const hour = parseInt(timeInput.split(":")[0]);

        // Fetch Live Weather for AI Inputs
        const meteoRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,cloud_cover,relative_humidity_2m&hourly=temperature_2m&timezone=auto`).then(r => r.json());

        // Neural Network Logic (Brain.js)
        const net = new brain.NeuralNetwork();
        net.train([
            { input: { temp: 0.6, clouds: 0.1, hour: 0.5 }, output: { irr: 0.9 } },
            { input: { temp: 0.3, clouds: 0.8, hour: 0.5 }, output: { irr: 0.2 } },
            { input: { temp: 0.2, clouds: 0.2, hour: 0.8 }, output: { irr: 0.1 } }
        ]);

        const result = net.run({
            temp: meteoRes.current.temperature_2m / 50,
            clouds: meteoRes.current.cloud_cover / 100,
            hour: hour / 24
        });

        const irrValue = result.irr * 1050;
        const strength = Math.min((irrValue / 1100) * 100, 100).toFixed(0);
        let energyMsg = strength > 70 ? "☀️ High Energy: Optimal peak for generation." : (strength > 30 ? "⛅ Moderate: Stable energy flow." : "☁️ Low: Minimal generation predicted.");

        document.getElementById("finalResult").innerHTML = `
            <h3 style="margin:0;">Location: ${currentLocation}, ${area}</h3>
            <div style="font-size:0.7rem; color:#27ae60; font-weight:bold;">CLEAN ENERGY FORECAST STRENGTH</div>
            <h1 style="font-size: 3rem; color: var(--accent-orange); margin: 10px 0;">${irrValue.toFixed(2)} <small style="font-size:1rem; color:white;">W/m²</small></h1>
            <div class="efficiency-bar">
            ${strength}% Efficiency Potential — ${energyMsg}
            </div>
            <p>Date: ${date} | Time: ${timeInput}</p>
           `;
            
        document.getElementById("liveWeatherStats").innerHTML = `
            <div style="background:var(--primary-blue); color:white; padding:15px; border-radius:10px;">
                <small> 🌡 Input Temperature</small>
                <div style="font-size:1.5rem;">${meteoRes.current.temperature_2m}°C</div>
            </div>
            <div style="background:var(--primary-blue); color:white; padding:15px; border-radius:10px;">
                <small> 💧 Input Cloud Cover</small>
                <div style="font-size:1.5rem;">${meteoRes.current.cloud_cover}%</div>
            </div>
        `;

        renderChart(meteoRes.hourly.temperature_2m.slice(0, 24));
        status.style.display = "none";
        showPage('resultPage');
    } catch (e) { 
        status.innerHTML = "❌ Connection Error."; 
        console.error(e);
    }
}

function renderChart(data) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    if(myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 24}, (_, i) => i + ":00"),
            datasets: [{ data: data, borderColor: '#f39c12', fill: true, tension: 0.4 }]
        },
        options: { plugins: { legend: { display: false } } }
    });
}

function downloadPDF() {
    const element = document.getElementById('printableReport');
    const opt = { 
        margin: 10, 
        filename: 'Solar_Report.pdf', 
        html2canvas: { scale: 2 }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };
    html2pdf().set(opt).from(element).save();
}