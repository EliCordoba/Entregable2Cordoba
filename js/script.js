// Alternar visibilidad del menú
document.getElementById("menuToggle").addEventListener("click", () => {
    const menuList = document.getElementById("menuList");
    menuList.classList.toggle("hidden");
});

// Mostrar secciones extra
function mostrarSeccion(id) {
    document.querySelectorAll('.info-extra').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// 🔄 Cargar fechas al iniciar
function cargarFechas() {
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const dias = [...Array(31).keys()].map(d => d + 1);
    const meses = [
        "01", "02", "03", "04", "05", "06",
        "07", "08", "09", "10", "11", "12"
    ];
    const anios = [anioActual, anioActual + 1];

    function rellenar(selectId, valores) {
        const select = document.getElementById(selectId);
        valores.forEach(val => {
            const option = document.createElement("option");
            option.value = val;
            option.textContent = val;
            select.appendChild(option);
        });
    }

    rellenar("ingresoDia", dias);
    rellenar("ingresoMes", meses);
    rellenar("ingresoAnio", anios);
    rellenar("salidaDia", dias);
    rellenar("salidaMes", meses);
    rellenar("salidaAnio", anios);
}

// Ejecutar al cargar
cargarFechas();

// 📝 Manejar envío de formulario
document.getElementById("formReserva").addEventListener("submit", function (e) {
    e.preventDefault();

    const ingreso = new Date(
        document.getElementById("ingresoAnio").value,
        document.getElementById("ingresoMes").value - 1,
        document.getElementById("ingresoDia").value
    );

    const salida = new Date(
        document.getElementById("salidaAnio").value,
        document.getElementById("salidaMes").value - 1,
        document.getElementById("salidaDia").value
    );

    const adultos = parseInt(document.getElementById("adultos").value);
    const menores = parseInt(document.getElementById("menores").value);
    const tipo = document.getElementById("tipo").value;

    if (isNaN(ingreso.getTime()) || isNaN(salida.getTime()) || ingreso >= salida) {
        document.getElementById("resultado").textContent = "❌ Fechas inválidas.";
        return;
    }

    const dias = Math.ceil((salida - ingreso) / (1000 * 60 * 60 * 24));
    if (dias < 3 || dias > 30) {
        document.getElementById("resultado").textContent = "❌ La estadía debe ser entre 3 y 30 días.";
        return;
    }

    let precioNoche = tipo === "doble" ? 20000 : 15000;
    let total = precioNoche * dias;

    if (total > 25000 * dias) {
        total = 25000 * dias;
    }

    const totalUSD = total / 1000;
    const totalBRL = total / 180;

    const mensaje = `✅ ¡Reserva realizada con éxito!
🏨 Habitación: ${tipo}
📆 Estandia: ${dias} noches
💰 Total: $${total} ARS / $${totalUSD.toFixed(2)} USD / R$${totalBRL.toFixed(2)} BRL`;

    document.getElementById("resultado").textContent = mensaje;

    localStorage.setItem("reservaHotelMarAzul", JSON.stringify({
        ingreso: ingreso.toDateString(),
        salida: salida.toDateString(),
        adultos,
        menores,
        tipo,
        total
    }));
});
