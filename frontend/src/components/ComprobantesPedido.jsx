import {useEffect,useRef,useState} from 'react'
import {listarComprobantes,subirComprobante,descargarComprobante,errorArchivo} from '../api/comprobantes.js'
import {mensajeError} from '../api/client.js'
import SelectorComprobante from './SelectorComprobante.jsx'
import Paginacion from './Paginacion.jsx'
import usePagination from './usePagination.js'
import PreviewComprobante from './PreviewComprobante.jsx'

export default function ComprobantesPedido({pedidoId,puedeSubir=false,onSubido}) {
  const [filas,setFilas]=useState(null),[error,setError]=useState(''),[archivo,setArchivo]=useState(null),[archivoError,setArchivoError]=useState(''),[ocupado,setOcupado]=useState(false),[version,setVersion]=useState(0),[vista,setVista]=useState(null),[aviso,setAviso]=useState('')
  const pagina=usePagination(filas??[],String(version))
  const [cargandoVista,setCargandoVista]=useState(false)
  const solicitud=useRef({version:0})
  useEffect(()=>{
    let vigente=true
    const control=solicitud.current
    listarComprobantes(pedidoId).then(async c=>{
      if(!vigente)return
      setFilas(c)
      if(c.length)await abrir(c[0])
    }).catch(e=>{if(vigente)setError(mensajeError(e))})
    return()=>{vigente=false;control.version++}
  },[pedidoId,version])
  useEffect(()=>()=>{if(vista)URL.revokeObjectURL(vista.url)},[vista])
  async function subir(){
    if(ocupado||!archivo||archivoError)return
    setOcupado(true);setError('');setAviso('')
    try{await subirComprobante(pedidoId,archivo);setArchivo(null);setVersion(v=>v+1);setAviso('Comprobante adjuntado. El estado del pago se conserva.');onSubido?.()}
    catch(e){setError(Object.values(e.response?.data?.error?.campos??{}).join(' ')||mensajeError(e))}
    finally{setOcupado(false)}
  }
  async function abrir(c){
    const actual=++solicitud.current.version
    setCargandoVista(true);setError('')
    try{
      const archivo=await descargarComprobante(c.id)
      if(actual!==solicitud.current.version)return
      const blob=archivo.type===c.tipo?archivo:new Blob([archivo],{type:c.tipo}),url=URL.createObjectURL(blob)
      setVista({url,nombre:c.nombre,tipo:c.tipo})
    }catch(e){if(actual===solicitud.current.version)setError(mensajeError(e))}finally{if(actual===solicitud.current.version)setCargandoVista(false)}
  }
  return <section className="comprobantes-pedido"><h3>Comprobantes</h3>
    {error&&<><p role="alert" className="users-alert">{error}</p><button type="button" className="button button-outline" disabled={ocupado} onClick={()=>{setError('');setVersion(v=>v+1)}}>Reintentar consulta</button></>}
    {aviso&&<p role="status">{aviso}</p>}{!filas&&!error&&<p role="status">Cargando comprobantes…</p>}{filas&&<p role="status">{filas.length?'Comprobante adjuntado':'Comprobante pendiente de subir'}</p>}
    <ul>{pagina.items.map(c=><li key={c.id}><button type="button" className="button button-outline" disabled={ocupado} onClick={()=>abrir(c)}>Ver comprobante: {c.nombre}</button></li>)}</ul><Paginacion datos={pagina} nombre="comprobantes" disabled={ocupado}/>
    {cargandoVista&&<p role="status">Cargando vista previa…</p>}
    {vista&&<PreviewComprobante {...vista} onCerrar={()=>setVista(null)}/>}
    {puedeSubir&&<><SelectorComprobante archivo={archivo} error={archivoError} disabled={ocupado} onChange={f=>{setArchivo(f);setArchivoError(errorArchivo(f))}}/>{!archivo&&<p role="status">Elegí una foto de tu galería o un archivo para habilitar la carga.</p>}<button type="button" className="button button-primary" disabled={ocupado||!archivo||Boolean(archivoError)} onClick={subir}>{ocupado?'Procesando…':'Adjuntar comprobante'}</button></>}
  </section>
}
