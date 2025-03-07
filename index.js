document.addEventListener('DOMContentLoaded', function() {
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
                        docx.Paragraph({
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