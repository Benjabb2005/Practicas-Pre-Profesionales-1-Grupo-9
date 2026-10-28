import {useEffect,useState} from 'react'
import {errorArchivo} from '../api/comprobantes.js'
import PreviewComprobante from './PreviewComprobante.jsx'
export default function SelectorComprobante({archivo,error,onChange,disabled}) {
  const [vista,setVista]=useState(null)
  useEffect(()=>()=>{if(vista)URL.revokeObjectURL(vista.url)},[vista])
  function seleccionar(f){
    setVista(f&&!errorArchivo(f)?{url:URL.createObjectURL(f),nombre:f.name,tipo:f.type||(/\.pdf$/i.test(f.name)?'application/pdf':'image/*')}:null)
    onChange(f)
  }
  return <div className="selector-comprobante"><label>Comprobante opcional (foto de galería o archivo PDF)
    <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={disabled} onChange={e=>seleccionar(e.target.files?.[0] || null)}/>
  </label><small>JPG, PNG, WEBP o PDF · máximo 5 MB. Si no lo adjuntás ahora, quedará pendiente de subir.</small>
    {archivo && <p>{archivo.name}</p>}{error && <p role="alert" className="users-alert">{error}</p>}
    {archivo&&vista&&<PreviewComprobante {...vista}/>}
  </div>
}
