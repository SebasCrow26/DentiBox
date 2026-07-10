/* =====================================================================
   MOCK-DATA.JS — datos de prueba en memoria (se pierden al recargar).
   Simulan el esquema que luego vivirá en Supabase (ver contexto del
   proyecto): clientes, productos, pedidos, pedido_items, promociones.
   Esto permite probar TODO el panel admin (cola de pedidos, clientes,
   promociones, analítica, factura) en Live Server, sin backend real.

   Cuando conectemos Supabase, este archivo se reemplaza por llamadas
   reales; las funciones DB.* de abajo están escritas para que el resto
   del código (admin.js) casi no tenga que cambiar.
===================================================================== */

function uid() {
  return (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2));
}

function daysAgo(n, hh = 9, mm = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

/* ---------- PRODUCTOS ---------- */
const _productos = [
  { id: 'p1', nombre: 'Resina compuesta A2 4g', categoria: 'restauracion', precio: 68000, stock: 24, imagen: '', descripcion: 'Resina fotocurable, tono A2.', oferta: false, nuevo: false, oculto: false },
  { id: 'p2', nombre: 'Bracket metálico Roth .022 kit', categoria: 'ortodoncia', precio: 145000, stock: 9, imagen: '', descripcion: 'Kit completo superior/inferior.', oferta: true, precioAnterior: 168000, nuevo: false, oculto: false },
  { id: 'p3', nombre: 'Guantes nitrilo talla M caja x100', categoria: 'bioseguridad', precio: 32000, stock: 60, imagen: '', descripcion: 'Sin polvo, alta sensibilidad táctil.', oferta: false, nuevo: false, oculto: false },
  { id: 'p4', nombre: 'Espejo bucal N.5 x12', categoria: 'instrumental', precio: 41000, stock: 15, imagen: '', descripcion: 'Acero quirúrgico, mango plano.', oferta: false, nuevo: true, oculto: false },
  { id: 'p5', nombre: 'Lima endodóntica ProTaper x6', categoria: 'endodoncia', precio: 89000, stock: 3, imagen: '', descripcion: 'Set rotatorio conicidad variable.', oferta: false, nuevo: false, oculto: false },
  { id: 'p6', nombre: 'Eyector de saliva caja x100', categoria: 'consumibles', precio: 18000, stock: 40, imagen: '', descripcion: 'Desechable, transparente.', oferta: false, nuevo: false, oculto: false },
  { id: 'p7', nombre: 'Cemento ionómero de vidrio', categoria: 'restauracion', precio: 76000, stock: 12, imagen: '', descripcion: 'Autocurable, restauración provisional.', oferta: false, nuevo: false, oculto: false },
  { id: 'p8', nombre: 'Alginato bolsa 450g', categoria: 'consumibles', precio: 29000, stock: 22, imagen: '', descripcion: 'Fraguado rápido, sabor menta.', oferta: false, nuevo: false, oculto: false },
];

/* ---------- CLIENTES (odontólogos) ---------- */
const _clientes = [
  { id: 'c1', nombre: 'Dra. Camila Rueda', direccion: 'Cra 15 #93-40, Consultorio 302, Bogotá', telefono: '3011234567', email: 'camila.rueda@sonrisasana.co', foto_fachada_url: '' },
  { id: 'c2', nombre: 'Dr. Andrés Lozano', direccion: 'Calle 72 #10-22, Bogotá', telefono: '3009876543', email: 'alozano.odonto@gmail.com', foto_fachada_url: '' },
  { id: 'c3', nombre: 'Dra. Paula Méndez', direccion: 'Av. Ciudad de Cali #15-60, Bogotá', telefono: '3157894561', email: 'paula.mendez@dentalcare.co', foto_fachada_url: '' },
  { id: 'c4', nombre: 'Dr. Juan Sebastián Rojas', direccion: 'Cra 7 #45-12, Bogotá', telefono: '3204567890', email: 'jsrojas.odontologia@hotmail.com', foto_fachada_url: '' },
  { id: 'c5', nombre: 'Dra. Laura Higuera', direccion: 'Calle 116 #19-40, Bogotá', telefono: '3112223344', email: 'laura.higuera@sonrisasplus.co', foto_fachada_url: '' },
];

/* ---------- PEDIDOS + ITEMS (embebidos para simplificar la simulación) ---------- */
const _pedidos = [
  { id: 'o1', numero_pedido: 1001, cliente_id: 'c2', estado: 'entregado', origen: 'online', created_at: daysAgo(6, 10, 15), entregado_at: daysAgo(5, 16, 0),
    items: [{ producto_id: 'p1', cantidad: 3 }, { producto_id: 'p6', cantidad: 2 }] },
  { id: 'o2', numero_pedido: 1002, cliente_id: 'c1', estado: 'entregado', origen: 'online', created_at: daysAgo(5, 9, 40), entregado_at: daysAgo(4, 15, 0),
    items: [{ producto_id: 'p3', cantidad: 4 }, { producto_id: 'p8', cantidad: 1 }] },
  { id: 'o3', numero_pedido: 1003, cliente_id: 'c1', estado: 'entregado', origen: 'presencial', created_at: daysAgo(4, 11, 5), entregado_at: daysAgo(4, 11, 20),
    items: [{ producto_id: 'p2', cantidad: 1 }] },
  { id: 'o4', numero_pedido: 1004, cliente_id: 'c3', estado: 'entregado', origen: 'online', created_at: daysAgo(3, 8, 50), entregado_at: daysAgo(2, 14, 0),
    items: [{ producto_id: 'p5', cantidad: 1 }, { producto_id: 'p7', cantidad: 2 }] },
  { id: 'o5', numero_pedido: 1005, cliente_id: 'c4', estado: 'cancelado', origen: 'online', created_at: daysAgo(2, 13, 10), entregado_at: null,
    items: [{ producto_id: 'p3', cantidad: 2 }] },
  { id: 'o6', numero_pedido: 1006, cliente_id: 'c1', estado: 'alistado', origen: 'online', created_at: daysAgo(1, 9, 5), entregado_at: null,
    items: [{ producto_id: 'p1', cantidad: 2 }, { producto_id: 'p4', cantidad: 1 }] },
  { id: 'o7', numero_pedido: 1007, cliente_id: 'c5', estado: 'pendiente', origen: 'online', created_at: daysAgo(0, 8, 30), entregado_at: null,
    items: [{ producto_id: 'p6', cantidad: 3 }, { producto_id: 'p3', cantidad: 1 }] },
  { id: 'o8', numero_pedido: 1008, cliente_id: 'c2', estado: 'pendiente', origen: 'online', created_at: daysAgo(0, 9, 50), entregado_at: null,
    items: [{ producto_id: 'p7', cantidad: 1 }] },
  { id: 'o9', numero_pedido: 1009, cliente_id: 'c1', estado: 'pendiente', origen: 'presencial', created_at: daysAgo(0, 10, 5), entregado_at: null,
    items: [{ producto_id: 'p8', cantidad: 2 }, { producto_id: 'p1', cantidad: 1 }] },
];

/* ---------- PROMOCIONES ---------- */
const _promociones = [
  { id: 'promo1', producto_id: 'p2', tipo: 'semana', precio_promocional: 129000, fecha_inicio: daysAgo(2).slice(0, 10), fecha_fin: daysAgo(-4).slice(0, 10), activo: true },
  { id: 'promo2', producto_id: 'p8', tipo: 'dia', precio_promocional: 24000, fecha_inicio: daysAgo(0).slice(0, 10), fecha_fin: daysAgo(0).slice(0, 10), activo: true },
];

let _numeroPedidoSeq = 1010;
let _numeroFacturaSeq = 5001;

/* ---------- "DB" — capa de acceso, pensada para calzar con Supabase después ---------- */
const DB = {
  productos: _productos,
  clientes: _clientes,
  pedidos: _pedidos,
  promociones: _promociones,

  getProducto(id) { return _productos.find(p => p.id === id); },
  getCliente(id) { return _clientes.find(c => c.id === id); },

  /** Pedidos en orden de llegada (FIFO) — equivalente a ORDER BY numero_pedido ASC */
  pedidosOrdenLlegada() {
    return [..._pedidos].sort((a, b) => a.numero_pedido - b.numero_pedido);
  },

  totalPedido(pedido) {
    return pedido.items.reduce((sum, it) => {
      const p = DB.getProducto(it.producto_id);
      return sum + (p ? p.precio * it.cantidad : 0);
    }, 0);
  },

  actualizarEstadoPedido(id, estado) {
    const p = _pedidos.find(x => x.id === id);
    if (!p) return;
    p.estado = estado;
    if (estado === 'entregado') p.entregado_at = new Date().toISOString();
  },

  quitarItemDePedido(pedidoId, index) {
    const p = _pedidos.find(x => x.id === pedidoId);
    if (!p) return;
    p.items.splice(index, 1);
    if (p.items.length === 0) p.estado = 'cancelado';
  },

  agregarCliente(data) {
    const c = { id: uid(), ...data };
    _clientes.push(c);
    return c;
  },

  actualizarCliente(id, data) {
    const c = _clientes.find(x => x.id === id);
    if (c) Object.assign(c, data);
  },

  eliminarCliente(id) {
    const idx = _clientes.findIndex(x => x.id === id);
    if (idx > -1) _clientes.splice(idx, 1);
  },

  /** Historial de pedidos de un cliente, más reciente primero */
  historialCliente(clienteId) {
    return _pedidos
      .filter(p => p.cliente_id === clienteId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  agregarPromocion(data) {
    const promo = { id: uid(), ...data };
    _promociones.push(promo);
    return promo;
  },

  actualizarPromocion(id, data) {
    const p = _promociones.find(x => x.id === id);
    if (p) Object.assign(p, data);
  },

  eliminarPromocion(id) {
    const idx = _promociones.findIndex(x => x.id === id);
    if (idx > -1) _promociones.splice(idx, 1);
  },

  /** Productos más vendidos, por unidades — GROUP BY producto_id */
  productosMasVendidos(limit = 5) {
    const acc = {};
    _pedidos.filter(p => p.estado !== 'cancelado').forEach(p => {
      p.items.forEach(it => {
        acc[it.producto_id] = acc[it.producto_id] || { unidades: 0, ingresos: 0 };
        const prod = DB.getProducto(it.producto_id);
        acc[it.producto_id].unidades += it.cantidad;
        acc[it.producto_id].ingresos += (prod ? prod.precio : 0) * it.cantidad;
      });
    });
    return Object.entries(acc)
      .map(([producto_id, v]) => ({ producto: DB.getProducto(producto_id), ...v }))
      .filter(x => x.producto)
      .sort((a, b) => b.unidades - a.unidades)
      .slice(0, limit);
  },

  /** Mejor cliente por total gastado — GROUP BY cliente_id */
  mejoresClientes(limit = 5) {
    const acc = {};
    _pedidos.filter(p => p.estado !== 'cancelado').forEach(p => {
      acc[p.cliente_id] = acc[p.cliente_id] || { pedidos: 0, total: 0 };
      acc[p.cliente_id].pedidos += 1;
      acc[p.cliente_id].total += DB.totalPedido(p);
    });
    return Object.entries(acc)
      .map(([cliente_id, v]) => ({ cliente: DB.getCliente(cliente_id), ...v }))
      .filter(x => x.cliente)
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  },

  nextNumeroFactura() { return _numeroFacturaSeq++; },
};

window.DB = DB;
window.uid = uid;
