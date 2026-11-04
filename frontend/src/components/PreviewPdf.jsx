import {useEffect,useRef,useState} from 'react'

export default function PreviewPdf({url,nombre}) {
  const canvas=useRef(null)
  const [pagina,setPagina]=useState(1),[total,setTotal]=useState(0),[cargando,setCargando]=useState(true),[error,setError]=useState('')
  useEffect(()=>{
    let vigente=true,tarea,render
    async function mostrar(){
      setCargando(true);setError('')
      try{
        const pdfjs=await import('pdfjs-dist')
        const worker=await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
        if(!vigente)return
        pdfjs.GlobalWorkerOptions.workerSrc=worker.default
        tarea=pdfjs.getDocument({url,isEvalSupported:false})
        const documento=await tarea.promise
        if(!vigente)return
        setTotal(documento.numPages)
        const hoja=await documento.getPage(pagina)
        if(!vigente)return
        const elemento=canvas.current,base=hoja.getViewport({scale:1})
        const ancho=elemento.parentElement.clientWidth
        const viewport=hoja.getViewport({scale:Math.min(ancho/base.width,2)*Math.min(window.devicePixelRatio||1,2)})
        elemento.width=viewport.width;elemento.height=viewport.height
        render=hoja.render({canvasContext:elemento.getContext('2d'),viewport})
        await render.promise
      }catch(e){if(vigente&&e.name!=='RenderingCancelledException')setError('No se pudo mostrar el PDF. Podés descargarlo para verlo.')}
      finally{if(vigente)setCargando(false)}
    }
    mostrar()
    return()=>{vigente=false;render?.cancel();tarea?.destroy()}
  },[url,pagina])
  return <div className="preview-pdf">
    {cargando&&<p role="status">Cargando PDF…</p>}
    {error&&<p role="alert">{error}</p>}
    <canvas ref={canvas} role="img" aria-label={`PDF: ${nombre}, página ${pagina}`} hidden={Boolean(error)||cargando}/>
    {total>1&&<nav aria-label="Páginas del comprobante"><button type="button" className="button button-outline" disabled={cargando||pagina===1} onClick={()=>setPagina(p=>p-1)}>Página anterior</button><span>{pagina} / {total}</span><button type="button" className="button button-outline" disabled={cargando||pagina===total} onClick={()=>setPagina(p=>p+1)}>Página siguiente</button></nav>}
  </div>
}
