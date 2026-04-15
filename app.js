import { activosRef, db } from '/js/config.js';
import { onSnapshot, doc, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const { createApp, ref, computed, onUnmounted} = Vue;
const { createVuetify } = Vuetify;

const vuetify = createVuetify();

const app = createApp({
  setup() {
  

    const getColor = (calories) => {
      if (calories > 100) return 'red';
      if (calories > 50) return 'orange';
      return 'green';
    };


    const pintarColorEstado = (condicion) => {
      if (condicion == 'EN USO') return 'green';
      if (condicion == 'RETIRADO') return 'red';
      return 'orange';
    };

    const pintarColorPlaca = (numPlaca) => {
      if (numPlaca == '100003') return 'red';
      if (numPlaca == '100004') return 'orange';
      return 'green';
    };

    //// mis funciones ///
   // ESTADO DEL SISTEMA
    const listaActivos = ref([]);
    const terminoBusqueda = ref('');
    const estaCargando = ref(true);
    const mostrarDialogo = ref(false);
    
    const itemPorDefecto = { 
        numPlaca: '', 
        codBien: '', 
        numSerie: '', 
        marca: '', 
        modelo: '', 
        unidadEjecutora: '2235-TI', // Valor por defecto
        fechaIngresoInv: '', 
        fechaIngresoUnidad: '', 
        garantiaInicio: '', 
        garantiaFin: '', 
        descripcion: '' 
    };
    const modeloFormulario = ref({ ...itemPorDefecto });
    const esModoEdicion = ref(false);

    const columnasTabla = [
      { title: 'PLACA', key: 'numPlaca' },
      { title: 'CÓD. BIEN', key: 'codBien' },
      {title: 'Ingreso Inventario', key: 'fechaIngresoInv'},
      { title: 'MARCA', key: 'marca' },
      { title: 'ESTADO', key: 'condicion', align: 'center' },
      { title: 'ACCIONES', key: 'acciones', align: 'end', sortable: false },
    ];

// FUNCIÓN 1: Sincronización Realtime con Manejo de Memoria
    const unsubscribe = onSnapshot(activosRef, (snapshot) => {
      listaActivos.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      estaCargando.value = false;
           listaActivos.value.forEach(activo => {
           // console.log(activo); 
    //console.log("Estado del activo:", activo.estadoActual); 
  });
    }, (error) => {
      console.error("Error en snapshot:", error);
      estaCargando.value = false;
    });

    onUnmounted(() => unsubscribe());



// FUNCIÓN 3: Estadísticas del Dashboard
    const estadisticas = computed(() => {
      const total = listaActivos.value.length;
      return [
        { title: 'Total activos', valor: total, icon: 'mdi-database', color: 'blue' },
        { title: 'En uso', valor: listaActivos.value.filter(a => a.estadoActual === 'EN USO').length, icon: 'mdi-check-circle', color: 'green' },
        { title: 'En reparación', valor: listaActivos.value.filter(a => a.estadoActual === 'REPARACION').length, icon: 'mdi-wrench', color: 'orange' },
        { title: 'Retirados', valor: listaActivos.value.filter(a => a.estadoActual === 'RETIRADO').length, icon: 'mdi-close-circle', color: 'red' }
      ];
    });
 // FUNCIONES CRUD
    const abrirDialogoNuevo = () => {
      esModoEdicion.value = false;
      modeloFormulario.value = { ...itemPorDefecto };
      mostrarDialogo.value = true;
    };

    const abrirDialogoEdicion = (item) => {
      esModoEdicion.value = true;
      modeloFormulario.value = { ...item };
      mostrarDialogo.value = true;
    };

    const guardarActivo = async () => {
      if (!modeloFormulario.value.numPlaca) {
        alert("⚠️ El número de placa es obligatorio.");
        return;
      }

      estaCargando.value = true;
      try {
        const placaNueva = modeloFormulario.value.numPlaca.toString().trim();

        if (!esModoEdicion.value) { 
          const existe = listaActivos.value.some(a => 
            a.numPlaca?.toString().trim() === placaNueva
          );

          if (existe) {
            alert(`⚠️ ERROR: La placa ${placaNueva} ya existe.`);
            estaCargando.value = false;
            return;
          }
          await addDoc(activosRef, modeloFormulario.value);
        } else {
          const { id, ...datos } = modeloFormulario.value;
          await updateDoc(doc(db, "Activos", id), datos);
        }
        
        mostrarDialogo.value = false;
      } catch (e) { 
        console.error("Error al guardar:", e);
        alert("Error de conexión con la base de datos.");
      } finally {
        estaCargando.value = false;
      }
    };

    const eliminarActivo = async (id) => {
      // Confirmación con código de seguridad 2235
      const confirmacion = confirm('¿Confirma que desea eliminar este registro?');
      if (confirmacion) {
        try {
          await deleteDoc(doc(db, "Activos", id));
        } catch (e) {
          alert("Error al eliminar el registro.");
        }
      }
    };

    const cerrarSesion = () => {
      alert("Saliendo del sistema Vele Provincial+...");
    };

    return {
      
      getColor,
      listaActivos, terminoBusqueda, estaCargando, columnasTabla, 
      estadisticas, mostrarDialogo, modeloFormulario, esModoEdicion,
      abrirDialogoNuevo, abrirDialogoEdicion, guardarActivo, eliminarActivo, 
       cerrarSesion, pintarColorEstado, pintarColorPlaca,
    };
  }
});

app.use(vuetify).mount('#app');