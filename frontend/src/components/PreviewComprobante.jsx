export default function PreviewComprobante({url,tipo,nombre,onCerrar}) {
  return <section className="preview-comprobante" aria-label={`Vista previa de ${nombre}`}>
    <header><strong>Vista previa · {nombre}</strong>{onCerrar&&<button type="button" className="button button-outline" onClick={onCerrar}>Cerrar vista previa</button>}</header>
    {tipo==='application/pdf'?<PreviewPdf key={url} url={url} nombre={nombre}/>:<img src={url} alt={`Comprobante: ${nombre}`}/>}
    <a className="button button-outline" href={url} download={nombre}>Descargar comprobante</a>
  </section>
}
import PreviewPdf from './PreviewPdf.jsx'

