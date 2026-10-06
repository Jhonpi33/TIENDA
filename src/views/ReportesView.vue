<!--
  ============================================================================
  ReportesView.vue
  ============================================================================
  RESPONSABILIDAD: mostrar indicadores de inventario, valorización y
  movimientos. Esta vista SOLO LEE datos: nunca modifica los stores.

  Todos los datos derivados se calculan con "computed", de modo que la vista
  se actualiza sola cuando cambian productos, categorías, proveedores o
  movimientos (reactividad de Pinia).

  Los filtros trabajan sobre copias locales de lectura; no escriben en stores.
  ============================================================================
-->
<template>
  <q-page class="reportes-page">
    <!--
      1. Encabezado de la sección
      Acciones: exportar el reporte actual (respetando los filtros) a CSV y a PDF.
      La generación vive en utils/exportaciones.js; aquí solo se dispara.
    -->
    <PageHeader title="Reportes" description="Indicadores del inventario, valorización y movimientos">
      <template #actions>
        <q-btn flat color="primary" icon="description" label="Exportar CSV" no-caps @click="exportarCSV" />

        <q-btn color="primary" icon="picture_as_pdf" label="Exportar PDF" no-caps @click="exportarPDF" />
      </template>
    </PageHeader>

    <!--
      El resultado de cada exportación ya no se muestra en un banner local:
      se informa con SweetAlert2 (toast de éxito, aviso si no hay datos o
      modal de error) para que Reportes use el mismo patrón que el resto.
    -->

    <!--
      2. FILTROS
      - fechas  -> filtran MOVIMIENTOS
      - categoría y estado -> filtran el INVENTARIO (productos)
      Se explic en el texto de ayuda para que quede claro qué afecta qué.
    -->
    <q-card class="bloque">
      <q-card-section class="filtros-grid">
        <q-input v-model="fechaInicio" type="date" outlined dense label="Fecha inicial" />

        <q-input v-model="fechaFin" type="date" outlined dense label="Fecha final" />

        <q-select v-model="categoriaFiltro" :options="categoriasStore.categorias" option-label="nombre"
          option-value="id" emit-value map-options outlined dense clearable label="Categoría" />

        <q-select v-model="estadoFiltro" :options="opcionesEstado" option-label="label" option-value="value"
          emit-value map-options outlined dense label="Estado del stock" />

        <div class="filtros-accion">
          <q-btn flat dense icon="clear" label="Limpiar filtros" no-caps @click="limpiarFiltros" />
        </div>
      </q-card-section>

      <q-card-section class="filtros-ayuda">
        Las fechas filtran los movimientos · la categoría y el estado filtran los productos.
      </q-card-section>
    </q-card>

    <!-- 3. Resumen general -->
    <section class="bloque">
      <h2 class="seccion-titulo">Resumen general</h2>

      <div class="tarjetas-grid">
        <SummaryCard title="Productos" :value="productosFiltrados.length" description="Productos registrados"
          icon="inventory_2" />

        <SummaryCard title="Unidades disponibles" :value="unidadesDisponibles" description="Existencias totales"
          icon="layers" />

        <SummaryCard title="Categorías" :value="categoriasStore.totalCategorias" description="Categorías registradas"
          icon="category" />

        <SummaryCard title="Proveedores" :value="proveedoresStore.totalProveedores" description="Proveedores registrados"
          icon="local_shipping" />

        <SummaryCard title="Movimientos" :value="movimientosFiltrados.length" description="Según el rango de fechas"
          icon="swap_horiz" />
      </div>
    </section>

    <!-- 4. Valorización -->
    <section class="bloque">
      <h2 class="seccion-titulo">Valorización del inventario</h2>

      <div class="tarjetas-grid">
        <SummaryCard title="Valor al costo" :value="formatearMoneda(valorizacion.costo)"
          description="suma(cantidad × precio de compra)" icon="attach_money" />

        <SummaryCard title="Valor de venta" :value="formatearMoneda(valorizacion.venta)"
          description="suma(cantidad × precio de venta)" icon="payments" />

        <SummaryCard title="Margen potencial" :value="formatearMoneda(valorizacion.margen)"
          description="valor de venta − valor al costo" icon="trending_up" />
      </div>
    </section>

    <!-- 5. Inventario por categoría -->
    <section class="bloque">
      <h2 class="seccion-titulo">Inventario por categoría</h2>

      <q-card class="tabla-card">
        <q-table flat :rows="inventarioPorCategoria" row-key="nombre" :columns="columnasCategoria"
          no-data-label="No hay productos para los filtros seleccionados" />
      </q-card>
    </section>

    <!-- 6. Inventario por proveedor -->
    <section class="bloque">
      <h2 class="seccion-titulo">Inventario por proveedor</h2>

      <q-card class="tabla-card">
        <q-table flat :rows="inventarioPorProveedor" row-key="nombre" :columns="columnasProveedor"
          no-data-label="No hay productos para los filtros seleccionados" />
      </q-card>
    </section>

    <!--
      7. ESTADO DEL STOCK
      Barra apilada construida solo con HTML/CSS (sin librerías):
      el ancho de cada tramo es el porcentaje correspondiente.
    -->
    <section class="bloque">
      <h2 class="seccion-titulo">Estado del stock</h2>

      <q-card class="tabla-card">
        <!-- Sin productos para los filtros: estado vacío en lugar de una barra en ceros -->
        <q-card-section v-if="estadoStock.total === 0">
          <EmptyState icon="donut_small" title="Sin datos"
            description="No hay productos para los filtros seleccionados." />
        </q-card-section>

        <q-card-section v-else>
          <div class="barra-estado">
            <span class="barra-disponible" :style="{ width: estadoStock.pctDisponibles + '%' }" />
            <span class="barra-bajo" :style="{ width: estadoStock.pctBajo + '%' }" />
            <span class="barra-agotado" :style="{ width: estadoStock.pctAgotados + '%' }" />
          </div>

          <div class="leyenda-grid">
            <div class="leyenda-item">
              <span class="punto punto-disponible" />
              <div>
                <div class="leyenda-valor">{{ estadoStock.disponibles }}</div>
                <div class="leyenda-label">Disponibles ({{ estadoStock.pctDisponibles }}%)</div>
              </div>
            </div>

            <div class="leyenda-item">
              <span class="punto punto-bajo" />
              <div>
                <div class="leyenda-valor">{{ estadoStock.bajo }}</div>
                <div class="leyenda-label">Stock bajo ({{ estadoStock.pctBajo }}%)</div>
              </div>
            </div>

            <div class="leyenda-item">
              <span class="punto punto-agotado" />
              <div>
                <div class="leyenda-valor">{{ estadoStock.agotados }}</div>
                <div class="leyenda-label">Agotados ({{ estadoStock.pctAgotados }}%)</div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </section>

    <!-- 8. Resumen de movimientos -->
    <section class="bloque">
      <h2 class="seccion-titulo">Movimientos</h2>

      <q-card class="tabla-card">
        <q-card-section class="mov-grid">
          <div class="mov-stat">
            <q-icon name="add_circle" color="positive" size="28px" />
            <div class="mov-valor text-positive">{{ resumenMovimientos.entradas }}</div>
            <div class="mov-label">Entradas</div>
          </div>

          <div class="mov-stat">
            <q-icon name="remove_circle" color="negative" size="28px" />
            <div class="mov-valor text-negative">{{ resumenMovimientos.salidas }}</div>
            <div class="mov-label">Salidas</div>
          </div>

          <div class="mov-stat">
            <q-icon name="tune" color="info" size="28px" />
            <div class="mov-valor text-info">{{ resumenMovimientos.ajustes }}</div>
            <div class="mov-label">Ajustes</div>
          </div>

          <div class="mov-stat">
            <q-icon name="arrow_upward" color="positive" size="28px" />
            <div class="mov-valor text-positive">{{ resumenMovimientos.unidadesIngresadas }}</div>
            <div class="mov-label">Unidades ingresadas</div>
          </div>

          <div class="mov-stat">
            <q-icon name="arrow_downward" color="negative" size="28px" />
            <div class="mov-valor text-negative">{{ resumenMovimientos.unidadesRetiradas }}</div>
            <div class="mov-label">Unidades retiradas</div>
          </div>
        </q-card-section>
      </q-card>
    </section>

    <!--
      9. Últimos movimientos
      Se reutiliza MovimientoTable tal cual (sin modificarlo): resuelve el
      nombre del producto y muestra "Producto eliminado" si ya no existe.
    -->
    <section class="bloque">
      <h2 class="seccion-titulo">Últimos 10 movimientos</h2>

      <MovimientoTable :movements="ultimosMovimientos" />
    </section>

    <!--
      10. Gráfico de movimientos
      Barras horizontales hechas con HTML + CSS, sin dependencias.
      El ancho de cada barra es proporcional al máximo de los tres tipos.
    -->
    <section class="bloque">
      <h2 class="seccion-titulo">Movimientos por tipo</h2>

      <q-card class="tabla-card">
        <q-card-section>
          <EmptyState v-if="movimientosFiltrados.length === 0" icon="swap_horiz" title="Sin movimientos"
            description="No hay movimientos registrados en el rango de fechas seleccionado." />

          <div v-else>
            <div v-for="barra in graficoMovimientos" :key="barra.tipo" class="grafico-fila">
              <div class="grafico-label">{{ barra.label }}</div>

              <div class="grafico-barra">
                <div class="grafico-relleno" :class="barra.clase" :style="{ width: barra.porcentaje + '%' }" />
              </div>

              <div class="grafico-valor" :class="barra.texto">{{ barra.valor }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </section>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'

// Stores: solo se leen, nunca se modifican
import { useProductosStore } from '../stores/productos'
import { useMovimientosStore } from '../stores/movimientos'
import { useCategoriasStore } from '../stores/categorias'
import { useProveedoresStore } from '../stores/proveedores'

// Componentes reutilizados (sin modificar)
import PageHeader from '../components/ui/PageHeader.vue'
import SummaryCard from '../components/ui/SummaryCard.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import MovimientoTable from '../components/movements/MovimientoTable.vue'

// Utilidades de exportación (CSV/PDF): la vista solo arma las secciones
// del reporte con los datos que ya calculó y se las pasa al generador.
import {
    formatearMoneda,
    generarCSV,
    generarPDF,
    descargarTexto,
    nombreArchivoReporte
} from '../utils/exportaciones'

// Alertas unificadas del sistema (SweetAlert2)
import { mostrarAviso, mostrarError, mostrarExito } from '../utils/alertas'

const productosStore = useProductosStore()
const movimientosStore = useMovimientosStore()
const categoriasStore = useCategoriasStore()
const proveedoresStore = useProveedoresStore()

// ---------------------------------------------------------------------------
// FILTROS (refs locales: afectan solo a los cálculos de esta vista)
// ---------------------------------------------------------------------------
const fechaInicio = ref('')
const fechaFin = ref('')
const categoriaFiltro = ref('')
const estadoFiltro = ref('')

const opcionesEstado = [
    { label: 'Todos', value: '' },
    { label: 'Disponibles', value: 'disponible' },
    { label: 'Stock bajo', value: 'bajo' },
    { label: 'Agotados', value: 'agotado' }
]

function limpiarFiltros() {
    fechaInicio.value = ''
    fechaFin.value = ''
    categoriaFiltro.value = ''
    estadoFiltro.value = ''
}

// ---------------------------------------------------------------------------
// LÓGICA DE ESTADO
// Misma regla que usa el store de productos (getters productosAgotados y
// productosStockBajo) para no inventar criterios distintos:
//   agotado    -> cantidad === 0
//   stock bajo -> cantidad > 0 y cantidad <= stockMinimo
//   disponible -> el resto
// ---------------------------------------------------------------------------
function obtenerEstado(producto) {
    if (producto.cantidad === 0) {
        return 'agotado'
    }

    if (producto.cantidad <= producto.stockMinimo) {
        return 'bajo'
    }

    return 'disponible'
}

// ---------------------------------------------------------------------------
// FECHAS
// La fecha del movimiento es ISO (UTC). Se convierte a la fecha LOCAL en
// formato AAAA-MM-DD para compararla con los inputs type="date", que también
// entregan AAAA-MM-DD. Así no hay problemas de desfase UTC/local.
// ---------------------------------------------------------------------------
function fechaLocal(fecha) {
    if (!fecha) {
        return ''
    }

    const fechaObjeto = new Date(fecha)

    const anio = fechaObjeto.getFullYear()
    const mes = String(fechaObjeto.getMonth() + 1).padStart(2, '0')
    const dia = String(fechaObjeto.getDate()).padStart(2, '0')

    return `${anio}-${mes}-${dia}`
}

// Nota: formatearMoneda vive en utils/exportaciones.js para que la pantalla y
// las exportaciones usen exactamente el mismo formato de pesos colombianos.

// ---------------------------------------------------------------------------
// DATOS FILTRADOS
// ---------------------------------------------------------------------------
// Inventario filtrado por categoría y estado.
// Se parte de "productosCompletos" porque ese getter ya resuelve los nombres
// con su fallback: 'Sin categoría' y 'Sin proveedor'.
const productosFiltrados = computed(() => {
    return productosStore.productosCompletos.filter((producto) => {
        const coincideCategoria =
            !categoriaFiltro.value ||
            Number(producto.categoriaId) === Number(categoriaFiltro.value)

        const coincideEstado =
            !estadoFiltro.value ||
            obtenerEstado(producto) === estadoFiltro.value

        return coincideCategoria && coincideEstado
    })
})

// Movimientos filtrados por el rango de fechas (ambos extremos son opcionales)
const movimientosFiltrados = computed(() => {
    return movimientosStore.movimientos.filter((movimiento) => {
        const fecha = fechaLocal(movimiento.fecha)

        if (fechaInicio.value && fecha < fechaInicio.value) {
            return false
        }

        if (fechaFin.value && fecha > fechaFin.value) {
            return false
        }

        return true
    })
})

// ---------------------------------------------------------------------------
// CÁLCULOS DEL REPORTE
// ---------------------------------------------------------------------------
const unidadesDisponibles = computed(() => {
    return productosFiltrados.value.reduce(
        (total, producto) => total + producto.cantidad,
        0
    )
})

const valorizacion = computed(() => {
    const totales = productosFiltrados.value.reduce(
        (acumulado, producto) => {
            acumulado.costo += producto.cantidad * producto.precioCompra
            acumulado.venta += producto.cantidad * producto.precioVenta
            return acumulado
        },
        { costo: 0, venta: 0 }
    )

    return {
        costo: totales.costo,
        venta: totales.venta,
        margen: totales.venta - totales.costo
    }
})

// Agrupa productos por el nombre resuelto (categoría o proveedor).
// Como el nombre ya viene con el fallback, un registro borrado aparece como
// 'Sin categoría' o 'Sin proveedor' en lugar de romper la tabla.
function agruparProductos(lista, campo) {
    const grupos = new Map()

    lista.forEach((producto) => {
        const clave = producto[campo] || ''

        if (!grupos.has(clave)) {
            grupos.set(clave, {
                nombre: clave,
                productos: 0,
                unidades: 0,
                valorCosto: 0,
                valorVenta: 0
            })
        }

        const grupo = grupos.get(clave)

        grupo.productos += 1
        grupo.unidades += producto.cantidad
        grupo.valorCosto += producto.cantidad * producto.precioCompra
        grupo.valorVenta += producto.cantidad * producto.precioVenta
    })

    // Se ordena por unidades de mayor a menor, como es usual en reportes
    return [...grupos.values()].sort((a, b) => b.unidades - a.unidades)
}

const inventarioPorCategoria = computed(() => {
    return agruparProductos(productosFiltrados.value, 'categoriaNombre')
})

const inventarioPorProveedor = computed(() => {
    return agruparProductos(productosFiltrados.value, 'proveedorNombre')
})

const estadoStock = computed(() => {
    const lista = productosFiltrados.value

    const total = lista.length
    const disponibles = lista.filter((p) => obtenerEstado(p) === 'disponible').length
    const bajo = lista.filter((p) => obtenerEstado(p) === 'bajo').length
    const agotados = lista.filter((p) => obtenerEstado(p) === 'agotado').length

    // Porcentaje entero; si no hay productos se evita dividir entre cero
    const porcentaje = (valor) => (total ? Math.round((valor / total) * 100) : 0)

    return {
        total,
        disponibles,
        bajo,
        agotados,
        pctDisponibles: porcentaje(disponibles),
        pctBajo: porcentaje(bajo),
        pctAgotados: porcentaje(agotados)
    }
})

const resumenMovimientos = computed(() => {
    const lista = movimientosFiltrados.value

    const entradas = lista.filter((m) => m.tipo === 'entrada')
    const salidas = lista.filter((m) => m.tipo === 'salida')
    const ajustes = lista.filter((m) => m.tipo === 'ajuste')

    return {
        entradas: entradas.length,
        salidas: salidas.length,
        ajustes: ajustes.length,
        unidadesIngresadas: entradas.reduce((total, m) => total + m.cantidad, 0),
        unidadesRetiradas: salidas.reduce((total, m) => total + m.cantidad, 0)
    }
})

// 10 movimientos más recientes: se copia el array antes de ordenarlo para
// no alterar el estado del store
const ultimosMovimientos = computed(() => {
    return [...movimientosFiltrados.value]
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 10)
})

// Datos para el gráfico: cantidad de movimientos por tipo y su ancho relativo
const graficoMovimientos = computed(() => {
    const resumen = resumenMovimientos.value

    const maximo = Math.max(resumen.entradas, resumen.salidas, resumen.ajustes, 1)

    const barras = [
        { tipo: 'entrada', label: 'Entradas', valor: resumen.entradas, clase: 'entrada', texto: 'text-positive' },
        { tipo: 'salida', label: 'Salidas', valor: resumen.salidas, clase: 'salida', texto: 'text-negative' },
        { tipo: 'ajuste', label: 'Ajustes', valor: resumen.ajustes, clase: 'ajuste', texto: 'text-info' }
    ]

    return barras.map((barra) => ({
        ...barra,
        porcentaje: Math.round((barra.valor / maximo) * 100)
    }))
})

// ---------------------------------------------------------------------------
// COLUMNAS DE LAS TABLAS
// El campo es una función: q-table muestra directamente el texto formateado
// ---------------------------------------------------------------------------
const columnasCategoria = [
    { name: 'nombre', label: 'Categoría', field: 'nombre', align: 'left' },
    { name: 'productos', label: 'Productos', field: 'productos', align: 'center' },
    { name: 'unidades', label: 'Unidades', field: 'unidades', align: 'center' },
    { name: 'valorCosto', label: 'Valor al costo', field: (row) => formatearMoneda(row.valorCosto), align: 'right' },
    { name: 'valorVenta', label: 'Valor de venta', field: (row) => formatearMoneda(row.valorVenta), align: 'right' }
]

const columnasProveedor = [
    { name: 'nombre', label: 'Proveedor', field: 'nombre', align: 'left' },
    { name: 'productos', label: 'Productos', field: 'productos', align: 'center' },
    { name: 'unidades', label: 'Unidades', field: 'unidades', align: 'center' },
    { name: 'valorCosto', label: 'Valor al costo', field: (row) => formatearMoneda(row.valorCosto), align: 'right' },
    { name: 'valorVenta', label: 'Valor de venta', field: (row) => formatearMoneda(row.valorVenta), align: 'right' }
]

// ---------------------------------------------------------------------------
// EXPORTACIÓN (CSV / PDF)
// ---------------------------------------------------------------------------
// Las secciones se construyen con los MISMOS computed que pinta la vista, así
// que el archivo siempre coincide con lo que el usuario está viendo y respeta
// los filtros aplicados. El formato (tipos de columna) lo resuelve la
// utilidad: el CSV conserva números crudos y el PDF los formatea.
function etiquetaTipo(tipo) {
    const etiquetas = {
        entrada: 'Entrada',
        salida: 'Salida',
        ajuste: 'Ajuste'
    }

    return etiquetas[tipo] || String(tipo || '')
}

const seccionesExportables = computed(() => [
    {
        titulo: 'Resumen general',
        columnas: [
            { etiqueta: 'Indicador', tipo: 'texto' },
            { etiqueta: 'Valor', tipo: 'entero' }
        ],
        filas: [
            ['Productos', productosFiltrados.value.length],
            ['Unidades disponibles', unidadesDisponibles.value],
            ['Categorías', categoriasStore.totalCategorias],
            ['Proveedores', proveedoresStore.totalProveedores],
            ['Movimientos', movimientosFiltrados.value.length]
        ]
    },
    {
        titulo: 'Valorización del inventario',
        columnas: [
            { etiqueta: 'Concepto', tipo: 'texto' },
            { etiqueta: 'Valor (COP)', tipo: 'moneda' }
        ],
        filas: [
            ['Valor al costo', valorizacion.value.costo],
            ['Valor de venta', valorizacion.value.venta],
            ['Margen potencial', valorizacion.value.margen]
        ]
    },
    {
        titulo: 'Inventario por categoría',
        columnas: [
            { etiqueta: 'Categoría', tipo: 'texto' },
            { etiqueta: 'Productos', tipo: 'entero' },
            { etiqueta: 'Unidades', tipo: 'entero' },
            { etiqueta: 'Valor al costo (COP)', tipo: 'moneda' },
            { etiqueta: 'Valor de venta (COP)', tipo: 'moneda' }
        ],
        filas: inventarioPorCategoria.value.map((grupo) => [
            grupo.nombre,
            grupo.productos,
            grupo.unidades,
            grupo.valorCosto,
            grupo.valorVenta
        ])
    },
    {
        titulo: 'Inventario por proveedor',
        columnas: [
            { etiqueta: 'Proveedor', tipo: 'texto' },
            { etiqueta: 'Productos', tipo: 'entero' },
            { etiqueta: 'Unidades', tipo: 'entero' },
            { etiqueta: 'Valor al costo (COP)', tipo: 'moneda' },
            { etiqueta: 'Valor de venta (COP)', tipo: 'moneda' }
        ],
        filas: inventarioPorProveedor.value.map((grupo) => [
            grupo.nombre,
            grupo.productos,
            grupo.unidades,
            grupo.valorCosto,
            grupo.valorVenta
        ])
    },
    {
        titulo: 'Estado del stock',
        columnas: [
            { etiqueta: 'Estado', tipo: 'texto' },
            { etiqueta: 'Productos', tipo: 'entero' },
            { etiqueta: 'Porcentaje', tipo: 'texto' }
        ],
        filas: [
            ['Disponibles', estadoStock.value.disponibles, `${estadoStock.value.pctDisponibles}%`],
            ['Stock bajo', estadoStock.value.bajo, `${estadoStock.value.pctBajo}%`],
            ['Agotados', estadoStock.value.agotados, `${estadoStock.value.pctAgotados}%`]
        ]
    },
    {
        titulo: 'Movimientos',
        columnas: [
            { etiqueta: 'Indicador', tipo: 'texto' },
            { etiqueta: 'Valor', tipo: 'entero' }
        ],
        filas: [
            ['Movimientos', movimientosFiltrados.value.length],
            ['Entradas', resumenMovimientos.value.entradas],
            ['Salidas', resumenMovimientos.value.salidas],
            ['Ajustes', resumenMovimientos.value.ajustes],
            ['Unidades ingresadas', resumenMovimientos.value.unidadesIngresadas],
            ['Unidades retiradas', resumenMovimientos.value.unidadesRetiradas]
        ]
    },
    {
        titulo: 'Últimos 10 movimientos',
        columnas: [
            { etiqueta: 'Fecha', tipo: 'fecha' },
            { etiqueta: 'Tipo', tipo: 'texto' },
            { etiqueta: 'Producto', tipo: 'texto' },
            { etiqueta: 'Código', tipo: 'texto' },
            { etiqueta: 'Cantidad', tipo: 'entero' }
        ],
        filas: ultimosMovimientos.value.map((movimiento) => {
            // Misma resolución de producto que hace MovimientoTable
            const producto = productosStore.obtenerProductos(movimiento.productoId)

            return [
                fechaLocal(movimiento.fecha),
                etiquetaTipo(movimiento.tipo),
                producto ? producto.nombre : 'Producto eliminado',
                producto ? producto.codigo : '',
                movimiento.cantidad
            ]
        })
    }
])

// Contexto que acompaña al archivo (fecha de generación y filtros vigentes),
// para que quien lo abra sepa qué fue lo que se exportó.
function descripcionFiltros() {
    const filtros = []

    if (fechaInicio.value) {
        filtros.push(`desde ${fechaInicio.value}`)
    }

    if (fechaFin.value) {
        filtros.push(`hasta ${fechaFin.value}`)
    }

    if (categoriaFiltro.value) {
        const categoria = categoriasStore.obtenerCategoriaPorId(categoriaFiltro.value)
        filtros.push(`categoría: ${categoria ? categoria.nombre : 'no encontrada'}`)
    }

    if (estadoFiltro.value) {
        const estado = opcionesEstado.find((opcion) => opcion.value === estadoFiltro.value)
        filtros.push(`estado: ${estado ? estado.label : estadoFiltro.value}`)
    }

    return filtros.length ? filtros.join(' · ') : 'Ninguno'
}

// Se arma en el momento de exportar (no como computed) para que la fecha de
// generación siempre sea la real y no la del primer render.
function opcionesExportacion() {
    return {
        titulo: 'Reporte de inventario',
        metadatos: [
            {
                etiqueta: 'Generado',
                valor: new Date().toLocaleString('es-CO', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                })
            },
            // Deja explícita la moneda del reporte (encabezados y valores
            // monetarios se leen en pesos colombianos)
            { etiqueta: 'Moneda', valor: 'Pesos colombianos (COP)' },
            { etiqueta: 'Filtros', valor: descripcionFiltros() }
        ]
    }
}

// Mensaje de la última exportación: se informa con SweetAlert2 (toast de
// éxito si el archivo se generó, aviso si no hay datos y modal de error si
// algo falla). Nunca bloquea al usuario cuando solo avisa del resultado.
function hayDatosExportables() {
    return seccionesExportables.value.some((seccion) => seccion.filas.length > 0)
}

function exportarCSV() {
    if (!hayDatosExportables()) {
        mostrarAviso('No hay datos para exportar.')
        return
    }

    try {
        const contenido = generarCSV(seccionesExportables.value, opcionesExportacion())

        descargarTexto(contenido, nombreArchivoReporte('csv'))

        mostrarExito('Reporte CSV generado correctamente.')
    } catch (error) {
        mostrarError({
            titulo: 'No se pudo generar el reporte',
            texto: 'No fue posible generar el archivo CSV. Inténtalo de nuevo.'
        })
    }
}

function exportarPDF() {
    if (!hayDatosExportables()) {
        mostrarAviso('No hay datos para generar el PDF.')
        return
    }

    try {
        const documento = generarPDF(seccionesExportables.value, opcionesExportacion())

        documento.save(nombreArchivoReporte('pdf'))

        mostrarExito('PDF generado correctamente.')
    } catch (error) {
        mostrarError({
            titulo: 'No se pudo generar el reporte',
            texto: 'No fue posible generar el archivo PDF. Inténtalo de nuevo.'
        })
    }
}
</script>

<style scoped>
.reportes-page {
    padding: 24px;
}

/* Separación vertical entre secciones */
.bloque {
    margin-bottom: 24px;
}

.seccion-titulo {
    margin: 0 0 12px;
    font-size: 18px;
    line-height: 1.3;
    font-weight: 600;
}

/* Rejilla de tarjetas: se adapta al ancho disponible */
.tarjetas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
}

.filtros-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    align-items: end;
}

.filtros-accion {
    display: flex;
    justify-content: flex-end;
}

.filtros-ayuda {
    padding-top: 0;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
}

.tabla-card {
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
}

/* --- Estado del stock: barra apilada con CSS --- */
.barra-estado {
    display: flex;
    height: 22px;
    border-radius: 11px;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.08);
}

.barra-estado span {
    display: block;
    height: 100%;
    transition: width 0.3s ease;
}

.barra-disponible {
    background: var(--q-positive);
}

.barra-bajo {
    background: var(--q-warning);
}

.barra-agotado {
    background: var(--q-negative);
}

.leyenda-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-top: 16px;
}

.leyenda-item {
    display: flex;
    align-items: center;
    gap: 10px;
}

.punto {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex-shrink: 0;
}

.punto-disponible {
    background: var(--q-positive);
}

.punto-bajo {
    background: var(--q-warning);
}

.punto-agotado {
    background: var(--q-negative);
}

.leyenda-valor {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.2;
}

.leyenda-label {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
}

/* --- Resumen de movimientos --- */
.mov-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 16px;
}

.mov-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 6px;
}

.mov-valor {
    font-size: 24px;
    font-weight: 700;
    line-height: 1.1;
}

.mov-label {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
}

/* --- Gráfico de movimientos: barras horizontales con CSS --- */
.grafico-fila {
    display: grid;
    grid-template-columns: 90px minmax(0, 1fr) 56px;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.grafico-label {
    font-size: 13px;
    font-weight: 600;
}

.grafico-barra {
    height: 18px;
    border-radius: 9px;
    background: rgba(0, 0, 0, 0.08);
    overflow: hidden;
}

.grafico-relleno {
    height: 100%;
    border-radius: 9px;
    transition: width 0.3s ease;
}

.grafico-relleno.entrada {
    background: var(--q-positive);
}

.grafico-relleno.salida {
    background: var(--q-negative);
}

.grafico-relleno.ajuste {
    background: var(--q-info);
}

.grafico-valor {
    font-size: 14px;
    font-weight: 700;
    text-align: right;
}

/* --- Responsive --- */
@media (max-width: 900px) {
    .filtros-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .mov-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .leyenda-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 600px) {
    .reportes-page {
        padding: 16px;
    }

    .filtros-grid {
        grid-template-columns: 1fr;
    }

    .filtros-accion {
        justify-content: flex-start;
    }

    .mov-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .tabla-card {
        border-radius: 8px;
    }

    .grafico-fila {
        grid-template-columns: 74px minmax(0, 1fr) 44px;
    }
}
</style>
