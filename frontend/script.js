document.addEventListener('DOMContentLoaded', () => {
    // Updated UI Elements for Premium Design
    const mainCard = document.getElementById('mainCard');
    const uploadSection = document.getElementById('uploadSection');
    const dropZone = document.getElementById('dropZone');
    const csvInput = document.getElementById('csvInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const batchLoader = document.getElementById('batchLoader');

    // File Status UI
    const fileStatus = document.getElementById('fileStatus');
    const fileNameDisplay = document.getElementById('fileName');
    const clearFileBtn = document.getElementById('clearFileBtn');
    const dropZoneContent = dropZone.querySelector('.upload-hint');

    // Results UI
    const batchResultSection = document.getElementById('batchResultSection');
    const statTotal = document.getElementById('statTotal');
    const statFraud = document.getElementById('statFraud');
    const fraudTable = document.getElementById('fraudTable').querySelector('tbody');
    const exportBtn = document.getElementById('exportBtn');
    let currentAnalysisData = null;

    let selectedFile = null;

    // --- File Handling ---
    dropZone.addEventListener('click', () => csvInput.click());

    csvInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    function handleFile(file) {
        if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
            alert("Please upload a Valid CSV file.");
            return;
        }
        selectedFile = file;

        // Update UI
        fileNameDisplay.textContent = file.name;
        fileStatus.classList.remove('hidden');
        dropZone.style.display = 'none'; // Hide big drop zone
        uploadBtn.disabled = false;
    }

    clearFileBtn.addEventListener('click', () => {
        selectedFile = null;
        csvInput.value = '';
        fileStatus.classList.add('hidden');
        dropZone.style.display = 'block'; // Show drop zone again
        uploadBtn.disabled = true;
    });

    // --- Upload Logic ---
    uploadBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        // UI Loading
        const btnSpan = uploadBtn.querySelector('span');
        btnSpan.style.display = 'none';
        batchLoader.style.display = 'block';
        uploadBtn.disabled = true;

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('/upload_csv', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Upload failed');
            }

            const data = await response.json();

            setTimeout(() => {
                showBatchResult(data);
                resetUploadButton();
            }, 1000);

        } catch (error) {
            console.error(error);
            alert(`Error: ${error.message}`);
            resetUploadButton();
        }
    });

    function showBatchResult(data) {
        // Store data for export
        currentAnalysisData = data;

        // Transition: Hide upload card, show result card
        mainCard.classList.add('hidden');
        batchResultSection.classList.remove('hidden');

        // Update Stats
        statTotal.textContent = data.total_processed;
        statFraud.textContent = data.fraud_count;

        // Populate Table
        fraudTable.innerHTML = '';
        if (data.fraud_count === 0) {
            fraudTable.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 30px;">No Fraud Detected! ✅</td></tr>';
        } else {
            data.frauds.forEach(fraud => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${fraud['transaction id'] || '-'}</td>
                    <td>${fraud['transaction type']}</td>
                    <td>₹${fraud['amount (INR)']}</td>
                    <td>${fraud['sender_bank'] || '-'}</td>
                    <td style="color: var(--danger); font-weight: bold;">${fraud.fraud_prob}</td>
                `;
                fraudTable.appendChild(row);
            });
        }
    }

    // --- Export Logic ---
    // --- Export Logic ---
    exportBtn.addEventListener('click', () => {
        console.log("Export button clicked"); // Debug log

        if (!currentAnalysisData || !currentAnalysisData.frauds || currentAnalysisData.frauds.length === 0) {
            alert('No fraud data available to export.');
            return;
        }

        const headers = ["Transaction ID", "Type", "Amount", "Sender Bank", "Fraud Probability"];
        const rows = currentAnalysisData.frauds.map(fraud => [
            fraud['transaction id'] || '',
            fraud['transaction type'] || '',
            fraud['amount (INR)'] || '',
            fraud['sender_bank'] || '',
            fraud.fraud_prob || ''
        ]);

        // Join with commas and newlines
        const csvContent = [
            headers.join(","),
            ...rows.map(e => e.join(","))
        ].join("\n");

        // Use Blob for robust file download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "fraud_analysis_report.csv");
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up
    });

    resetBatchBtn.addEventListener('click', () => {
        batchResultSection.classList.add('hidden');
        mainCard.classList.remove('hidden');

        // Reset Upload State
        selectedFile = null;
        csvInput.value = '';
        fileStatus.classList.add('hidden');
        dropZone.style.display = 'block';
        uploadBtn.disabled = true;
        currentAnalysisData = null;
    });

    function resetUploadButton() {
        const btnSpan = uploadBtn.querySelector('span');
        btnSpan.style.display = 'block';
        batchLoader.style.display = 'none';
        uploadBtn.disabled = false;
    }

    // --- Helper Functions ---


});
