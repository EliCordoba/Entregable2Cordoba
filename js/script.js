document.addEventListener("DOMContentLoaded", () => {
  // --------- Referencias
  const form = document.getElementById("formReserva");
  const resultado = document.getElementById("resultado");
  const vaciarBtn = document.getElementById("vaciarTodo");
  const menuToggle = document.getElementById("menuToggle");
  const menuList = document.getElementById("menuList");
  const grid = document.getElementById("habitacionesGrid");
  const filtroTipo = document.getElementById("filtroTipo");
  const ordenPrecio = document.getElementById("ordenPrecio");

  // --------- Estado
  let reservas = JSON.parse(localStorage.getItem("reservas")) || [];
  let habitaciones = [];
  let tasas = { ARS_USD: 1000, ARS_BRL: 180 };

  // --------- Menú hamburguesa
  if (menuToggle && menuList) {
    menuToggle.addEventListener("click", () => {
      menuList.classList.toggle("show");
    });
  }

  // --------- Mostrar/Ocultar secciones
  window.mostrarSeccion = function(id) {
    document.querySelectorAll(".info-extra").forEach(sec => sec.classList.add("hidden"));
    const seccion = document.getElementById(id);
    if (seccion) seccion.classList.remove("hidden");
  };

  // --------- Helpers
  const guardarReservas = () => localStorage.setItem("reservas", JSON.stringify(reservas));
  const formatoMoneda = n => n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

  function nochesEntre(inicio, fin) {
    const [d, m, y] = inicio.split("/").map(Number);
    const fechaInicio = new Date(y, m-1, d);
    const [d2, m2, y2] = fin.split("/").map(Number);
    const fechaFin = new Date(y2, m2-1, d2);
    const ms = fechaFin - fechaInicio;
    return Math.ceil(ms / (1000*60*60*24));
  }

  function precioNochePorTipo(tipo) {
    const h = habitaciones.find(x => x.tipo === tipo);
    return h ? h.precioBase : 0;
  }

  function capacidadPorTipo(tipo) {
    const h = habitaciones.find(x => x.tipo === tipo);
    return h ? h.capacidad : 0;
  }

  // --------- Flatpickr para inputs de fecha
  if (window.flatpickr) {
    flatpickr("#fechaIngreso", { dateFormat: "d/m/Y" });
    flatpickr("#fechaSalida", { dateFormat: "d/m/Y" });
  }

  // --------- Render catálogo
  function renderCatalogo(lista) {
    if (!grid) return;
    grid.innerHTML = "";
    lista.forEach(h => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <img src="${h.imagen}" alt="${h.nombre}">
        <h3>${h.nombre}</h3>
        <p>Capacidad: ${h.capacidad} huéspedes</p>
        <p>Precio base: ${formatoMoneda(h.precioBase)} / noche</p>
        <div>${h.servicios.map(s => `<span class="badge">${s}</span>`).join("")}</div>
        <button class="elegir" data-tipo="${h.tipo}" style="margin-top:10px;">Elegir esta</button>
      `;
      grid.appendChild(card);
    });
  }

  function aplicarFiltros() {
    let lista = [...habitaciones];
    if (filtroTipo && filtroTipo.value !== "todas") lista = lista.filter(h => h.tipo === filtroTipo.value);
    if (ordenPrecio) {
      if (ordenPrecio.value === "asc") lista.sort((a,b)=>a.precioBase-b.precioBase);
      if (ordenPrecio.value === "desc") lista.sort((a,b)=>b.precioBase-a.precioBase);
    }
    renderCatalogo(lista);
  }

  if (filtroTipo) filtroTipo.addEventListener("change", aplicarFiltros);
  if (ordenPrecio) ordenPrecio.addEventListener("change", aplicarFiltros);

  if (grid) {
    grid.addEventListener("click", e => {
      const btn = e.target.closest(".elegir");
      if (!btn) return;
      const tipo = btn.dataset.tipo;
      const select = document.getElementById("tipo");
      if (select) select.value = tipo;
      mostrarSeccion("reservas");
      window.scrollTo({ top: document.getElementById("reservas").offsetTop - 10, behavior: "smooth" });
    });
  }

  // --------- Render reservas
  function mostrarReservas() {
    resultado.innerHTML = "";
    if (reservas.length === 0) {
      resultado.innerHTML = "<p>No hay reservas registradas.</p>";
      return;
    }

    reservas.forEach((r,index)=>{
      const div = document.createElement("div");
      div.classList.add("reserva");
      div.innerHTML = `
        <p><strong>${r.nombre}</strong> — ${r.fechaIngreso} a ${r.fechaSalida}</p>
        <p>Adultos: ${r.adultos} | Niños: ${r.menores} | Habitación: ${r.tipo}</p>
        <p>Total: ${formatoMoneda(r.totalARS)} (${(r.totalARS/ tasas.ARS_USD).toFixed(2)} USD • ${(r.totalARS/ tasas.ARS_BRL).toFixed(2)} BRL)</p>
        <div style="display:flex;gap:.5rem;margin-top:.5rem;">
          <button class="btn-editar" data-index="${index}">Editar</button>
          <button class="btn-borrar" data-index="${index}">Borrar</button>
        </div>
      `;
      resultado.appendChild(div);
    });
  }

  // --------- Delegación editar/borrar
  resultado.addEventListener("click", async e=>{
    const btnEditar = e.target.closest(".btn-editar");
    const btnBorrar = e.target.closest(".btn-borrar");

    if (btnEditar) {
      const i = +btnEditar.dataset.index;
      const r = reservas[i];
      form.dataset.editIndex = i;
      document.getElementById("nombre").value = r.nombre;
      document.getElementById("fechaIngreso").value = r.fechaIngreso;
      document.getElementById("fechaSalida").value = r.fechaSalida;
      document.getElementById("adultos").value = r.adultos;
      document.getElementById("menores").value = r.menores;
      document.getElementById("tipo").value = r.tipo;
      mostrarSeccion("reservas");
      return;
    }

    if (btnBorrar) {
      const i = +btnBorrar.dataset.index;
      const ok = await Swal.fire({
        title: "¿Borrar reserva?",
        text: "Esta acción no se puede deshacer",
        icon: "warning",
        showCancelButton:true,
        confirmButtonText:"Sí, borrar",
        cancelButtonText:"Cancelar"
      });
      if (ok.isConfirmed) {
        reservas.splice(i,1);
        guardarReservas();
        mostrarReservas();
        Swal.fire({icon:"success",title:"Reserva eliminada", timer:1200,showConfirmButton:false});
      }
    }
  });

  // --------- Guardar / Editar reserva
  form?.addEventListener("submit", async e=>{
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const fechaIngreso = document.getElementById("fechaIngreso").value;
    const fechaSalida = document.getElementById("fechaSalida").value;
    const adultos = parseInt(document.getElementById("adultos").value,10)||0;
    const menores = parseInt(document.getElementById("menores").value,10)||0;
    const tipo = document.getElementById("tipo").value;

    // Validaciones
    if(!nombre||!fechaIngreso||!fechaSalida){
      Swal.fire({icon:"error",title:"Datos incompletos",text:"Completá todos los campos."});
      return;
    }

    const noches = nochesEntre(fechaIngreso,fechaSalida);
    if(isNaN(noches)||noches<3||noches>30){
      Swal.fire({icon:"error",title:"Fechas inválidas",text:"La estadía debe ser entre 3 y 30 noches."});
      return;
    }

    const capacidad = capacidadPorTipo(tipo);
    if(capacidad && adultos+menores>capacidad){
      Swal.fire({icon:"error",title:"Capacidad excedida",text:`La ${tipo} admite hasta ${capacidad} huéspedes.`});
      return;
    }

    let totalARS = precioNochePorTipo(tipo)*noches;
    if(noches>=7) totalARS=Math.round(totalARS*0.9);

    const reserva = {nombre,fechaIngreso,fechaSalida,adultos,menores,tipo,totalARS};

    if(form.dataset.editIndex){
      reservas[+form.dataset.editIndex]=reserva;
      delete form.dataset.editIndex;
    } else {
      reservas.push(reserva);
    }

    guardarReservas();
    mostrarReservas();
    form.reset();

    await Swal.fire({
      icon:"success",
      title:"¡Reserva guardada!",
      html:`<p>${tipo.toUpperCase()} • ${noches} noches</p>
            <p>Total: ${formatoMoneda(totalARS)}<br>
            ${(totalARS/ tasas.ARS_USD).toFixed(2)} USD • ${(totalARS/ tasas.ARS_BRL).toFixed(2)} BRL</p>`,
      timer:2200,showConfirmButton:false
    });
  });

  // --------- Vaciar todas las reservas
  vaciarBtn?.addEventListener("click", async ()=>{
    const ok = await Swal.fire({
      title:"¿Vaciar todas las reservas?",
      icon:"warning",
      showCancelButton:true,
      confirmButtonText:"Vaciar",
      cancelButtonText:"Cancelar"
    });
    if(ok.isConfirmed){
      reservas=[];
      localStorage.removeItem("reservas");
      mostrarReservas();
      Swal.fire({icon:"success",title:"Reservas eliminadas",timer:1200,showConfirmButton:false});
    }
  });

  // --------- Precarga de fechas (3 noches a partir de hoy)
  (function precargarCampos(){
    const hoy=new Date();
    const ingreso=new Date(hoy.getFullYear(),hoy.getMonth(),hoy.getDate()+3);
    const salida=new Date(hoy.getFullYear(),hoy.getMonth(),hoy.getDate()+6);
    const fi=document.getElementById("fechaIngreso");
    const fs=document.getElementById("fechaSalida");

    const formatDDMMYYYY = d=>{
      const dd=String(d.getDate()).padStart(2,"0");
      const mm=String(d.getMonth()+1).padStart(2,"0");
      const yyyy=d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };
    if(fi&&!fi.value) fi.value=formatDDMMYYYY(ingreso);
    if(fs&&!fs.value) fs.value=formatDDMMYYYY(salida);
  })();

  // --------- Carga de datos
  async function cargarDatos(){
    try{
      const [habRes,cambioRes]=await Promise.all([
        fetch("data/habitaciones.json"),
        fetch("data/cambio.json")
      ]);
      habitaciones = await habRes.json();
      const tmp = await cambioRes.json();
      tasas={ARS_USD: tmp.ARS_USD, ARS_BRL: tmp.ARS_BRL};
      renderCatalogo(habitaciones);
      mostrarReservas();
    } catch(e){
      Swal.fire({icon:"error",title:"Error cargando datos",text:"Verificá data/habitaciones.json y data/cambio.json"});
    }
  }
  cargarDatos();
});
