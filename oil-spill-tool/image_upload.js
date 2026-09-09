document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    const button = document.createElement('button');
    button.innerHTML = '📷 Browse & Analyze Image';
    button.onclick = () => fileInput.click();
    document.body.appendChild(button);

    const resultDiv = document.createElement('div');
    resultDiv.id = 'resultDisplay';
    document.body.appendChild(resultDiv);

    fileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('http://127.0.0.1:8000/analyze-image', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        resultDiv.innerHTML = '<p style="color:cyan;">' + (data.result || data.error) + '</p>';
    });
});
