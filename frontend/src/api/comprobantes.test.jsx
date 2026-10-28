import{beforeEach,expect,it,vi}from'vitest'
import{renderToStaticMarkup}from'react-dom/server'
import{errorArchivo,subirComprobante,listarComprobantes,descargarComprobante}from'./comprobantes.js'
import{api}from'./client.js'
import SelectorComprobante from'../components/SelectorComprobante.jsx'
import PreviewComprobante from'../components/PreviewComprobante.jsx'
vi.mock('./client.js',()=>({api:{get:vi.fn(),post:vi.fn()}}))
beforeEach(()=>vi.resetAllMocks())
it('sube binario sin base64 ni identidad y consulta metadatos/archivo por rutas protegidas',async()=>{
 const f=new File(['%PDF-1.4'],'recibo.pdf',{type:'application/pdf'})
 api.post.mockResolvedValue({data:{comprobante:{id:2}}})
 expect(await subirComprobante(7,f)).toEqual({id:2})
 expect(api.post).toHaveBeenCalledWith('/comprobantes/pedido/7',f,{headers:{'Content-Type':'application/pdf','X-Nombre-Archivo':'recibo.pdf'}})
 api.get.mockResolvedValueOnce({data:{comprobantes:[{id:2}]}}).mockResolvedValueOnce({data:new Blob(['prueba'])})
 expect(await listarComprobantes(7)).toEqual([{id:2}])
 expect(await descargarComprobante(2)).toBeInstanceOf(Blob)
 expect(api.get).toHaveBeenLastCalledWith('/comprobantes/2',{responseType:'blob'})
})
it('selector permite galería y PDF, limita tamaño y rechaza formato ajeno',()=>{
 expect(errorArchivo({size:6*1024*1024,type:'image/png'})).toContain('5 MB')
 expect(errorArchivo({size:100,type:'text/html'})).toContain('PDF')
 expect(errorArchivo({size:100,type:'image/jpeg'})).toBe('')
 const html=renderToStaticMarkup(<SelectorComprobante/>)
 expect(html).toContain('type="file"')
 expect(html).toContain('application/pdf')
 expect(html).not.toContain('capture=')
})
it('vista previa interna de imágenes y PDF mantiene descarga accesible',()=>{
 const pdf=renderToStaticMarkup(<PreviewComprobante url="blob:prueba" tipo="application/pdf" nombre="recibo.pdf"/>)
 expect(pdf).toContain('<canvas')
 expect(pdf).toContain('Cargando PDF')
 expect(pdf).toContain('Descargar comprobante')
 expect(pdf).toContain('download="recibo.pdf"')
 const imagen=renderToStaticMarkup(<PreviewComprobante url="blob:prueba" tipo="image/png" nombre="foto.png"/>)
 expect(imagen).toContain('<img')
 expect(imagen).not.toContain('<object')
})
