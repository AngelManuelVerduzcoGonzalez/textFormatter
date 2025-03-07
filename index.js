document.addEventListener('DOMContentLoaded', function () {
    const convertBtn = document.getElementById('convertBtn');
    const inputText = document.getElementById('inputText');
    const statusDiv = document.getElementById('status');
    
    convertBtn.addEventListener('click', function() {
        const text = inputText.value.trim();
        if (!text) {
            statusDiv.textContent = 'Por favor, ingresa algún texto para convertir.';
            return;
        }
        
        // Obtener formatos seleccionados
        const formats = [];
        document.querySelectorAll('.format-options input[type="checkbox"]:checked').forEach(checkbox => {
            formats.push(checkbox.value);
        });
        
        if (formats.length === 0) {
            statusDiv.textContent = 'Por favor, selecciona al menos un formato de salida.';
            return;
        }
        
        // Convertir y descargar para cada formato seleccionado
        let successCount = 0;
        
        formats.forEach(format => {
            switch(format) {
                case 'txt':
                    downloadTxt(text);
                    successCount++;
                    break;
                case 'pdf':
                    downloadPdf(text);
                    successCount++;
                    break;
                case 'doc':
                    downloadDoc(text);
                    successCount++;
                    break;
                case 'odt':
                    downloadOdt(text);
                    successCount++;
                    break;
                case 'html':
                    downloadHtml(text);
                    successCount++;
                    break;
                case 'md':
                    downloadMarkdown(text);
                    successCount++;
                    break;
            }
        });
        
        statusDiv.textContent = `Conversión completa. Se generaron ${successCount} archivo(s).`;
    });
    
    // Función para descargar como TXT
    function downloadTxt(text) {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'documento.txt');
    }
    
    // Función para descargar como PDF
    function downloadPdf(text) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Dividir texto en múltiples líneas para que quepa en la página
        const lineHeight = 10;
        const pageWidth = doc.internal.pageSize.getWidth() - 20;
        const margin = 10;
        let y = 20;
        
        // Dividir el texto en párrafos
        const paragraphs = text.split('\n');
        
        for (let i = 0; i < paragraphs.length; i++) {
            const lines = doc.splitTextToSize(paragraphs[i], pageWidth);
            
            for (let j = 0; j < lines.length; j++) {
                // Si la línea no cabe en la página actual, crear una nueva
                if (y > doc.internal.pageSize.getHeight() - margin) {
                    doc.addPage();
                    y = 20;
                }
                
                doc.text(lines[j], margin, y);
                y += lineHeight;
            }
            
            y += lineHeight / 2; // Espacio extra entre párrafos
        }
        
        doc.save('documento.pdf');
    }
    
    // Función para descargar como DOC (usando docx.js)
    function downloadDoc(text) {
        // Verificar si la biblioteca docx está disponible correctamente
        if (typeof docx === 'undefined') {
            console.error('La biblioteca docx.js no está cargada correctamente');
            statusDiv.textContent = 'Error: No se pudo cargar la biblioteca para generar documentos DOCX.';
            return;
        }
        
        try {
            // Crear documento con docx global
            const doc = new docx.Document({
                sections: [{
                    properties: {},
                    children: text.split('\n').map(paragraph => 
                        new docx.Paragraph({
                            children: [
                                new docx.TextRun({
                                    text: paragraph
                                })
                            ]
                        })
                    )
                }]
            });
            
            // Generar y descargar
            docx.Packer.toBlob(doc).then(blob => {
                saveAs(blob, 'documento.docx');
            }).catch(error => {
                console.error('Error al generar el archivo DOCX:', error);
                statusDiv.textContent = 'Error al generar el archivo DOCX.';
            });
        } catch (error) {
            console.error('Error al crear el documento DOCX:', error);
            statusDiv.textContent = 'Error al crear el documento DOCX.';
        }
    }
    
    // Función para descargar como ODT
    function downloadOdt(text) {
        try {
            if (typeof JSZip === 'undefined') {
                console.error('La biblioteca JSZip no está cargada correctamente');
                statusDiv.textContent = 'Error: No se pudo cargar la biblioteca para generar documentos ODT.';
                return;
            }
            
            // Crear un nuevo archivo ZIP (ODT es un archivo ZIP con una estructura específica)
            const zip = new JSZip();
            
            // Agregar el archivo mimetype (requerido por ODT)
            zip.file("mimetype", "application/vnd.oasis.opendocument.text");
            
            // Crear el directorio META-INF
            const metaInf = zip.folder("META-INF");
            
            // Crear el archivo manifest.xml dentro de META-INF
            metaInf.file("manifest.xml", 
                '<?xml version="1.0" encoding="UTF-8"?>\n' +
                '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">\n' +
                '  <manifest:file-entry manifest:media-type="application/vnd.oasis.opendocument.text" manifest:full-path="/"/>\n' +
                '  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="content.xml"/>\n' +
                '  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="meta.xml"/>\n' +
                '  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="styles.xml"/>\n' +
                '</manifest:manifest>'
            );
            
            // Convertir el texto en párrafos XML para el archivo content.xml
            const paragraphs = text.split('\n').map(para => {
                if (para.trim() === '') {
                    return '<text:p/>';
                } else {
                    // Escapar caracteres especiales XML
                    const escapedPara = para
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&apos;");
                    return `<text:p>${escapedPara}</text:p>`;
                }
            }).join('\n');
            
            // Crear el archivo content.xml
            zip.file("content.xml", 
                '<?xml version="1.0" encoding="UTF-8"?>\n' +
                '<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" ' +
                'xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" ' +
                'xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" ' +
                'office:version="1.2">\n' +
                '  <office:body>\n' +
                '    <office:text>\n' +
                paragraphs + '\n' +
                '    </office:text>\n' +
                '  </office:body>\n' +
                '</office:document-content>'
            );
            
            // Crear el archivo meta.xml
            const today = new Date().toISOString();
            zip.file("meta.xml", 
                '<?xml version="1.0" encoding="UTF-8"?>\n' +
                '<office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" ' +
                'xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0" ' +
                'office:version="1.2">\n' +
                '  <office:meta>\n' +
                '    <meta:creation-date>' + today + '</meta:creation-date>\n' +
                '    <meta:generator>Text Converter Web App</meta:generator>\n' +
                '  </office:meta>\n' +
                '</office:document-meta>'
            );
            
            // Crear el archivo styles.xml
            zip.file("styles.xml", 
                '<?xml version="1.0" encoding="UTF-8"?>\n' +
                '<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" ' +
                'xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" ' +
                'office:version="1.2">\n' +
                '  <office:styles>\n' +
                '    <style:default-style style:family="paragraph">\n' +
                '      <style:text-properties style:font-name="Arial" style:font-size="12pt"/>\n' +
                '    </style:default-style>\n' +
                '  </office:styles>\n' +
                '</office:document-styles>'
            );
            
            // Generar el archivo ODT
            zip.generateAsync({type: "blob", mimeType: "application/vnd.oasis.opendocument.text"})
            .then(function(content) {
                saveAs(content, "documento.odt");
            })
            .catch(function(error) {
                console.error('Error al generar el archivo ODT:', error);
                statusDiv.textContent = 'Error al generar el archivo ODT.';
            });
        } catch (error) {
            console.error('Error al crear el documento ODT:', error);
            statusDiv.textContent = 'Error al crear el documento ODT.';
        }
    }
    
    // Función para descargar como HTML
    function downloadHtml(text) {
        // Escapar entidades HTML
        function escapeHtml(unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
        
        // Convertir saltos de línea a <p>
        const paragraphs = text.split('\n').map(para => 
            `<p>${escapeHtml(para)}</p>`
        ).join('');
        
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Documento</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
            </style>
        </head>
        <body>
            ${paragraphs}
        </body>
        </html>
        `;
        
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        saveAs(blob, 'documento.html');
    }
    
    // Función para descargar como Markdown
    function downloadMarkdown(text) {
        // Para archivos Markdown simple, podemos usar el texto tal cual
        // Se podrían agregar conversiones más complejas si fuera necesario
        const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
        saveAs(blob, 'documento.md');
    }
});