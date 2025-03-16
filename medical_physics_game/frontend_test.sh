#!/bin/bash
echo "=== FRONTEND COMPONENT VERIFICATION ==="

# Create list of critical components to test
components=(
  "Character Selection"
  "Game Map Rendering"
  "Node Interaction"
  "Combat System"
  "Skill Tree"
  "Inventory Management"
  "Item Usage"
  "Question Answering"
)

# Create a browser test page
cat > tests/manual_verification.html << 'HTML_EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Medical Physics Game Component Verification</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; }
        .component { margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .name { font-weight: bold; }
        .status { margin-top: 10px; }
        .passed { color: green; }
        .failed { color: red; }
        button { padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .notes { margin-top: 10px; width: 100%; height: 60px; }
    </style>
</head>
<body>
    <h1>Manual Component Verification</h1>
    <p>Please verify each component functions correctly in the new structure:</p>
    <div id="components"></div>
    <br>
    <button onclick="generateReport()">Generate Report</button>
    <div id="report" style="margin-top: 20px;"></div>

    <script>
        // Component list from bash script
        const components = [
            "Character Selection",
            "Game Map Rendering",
            "Node Interaction",
            "Combat System",
            "Skill Tree",
            "Inventory Management",
            "Item Usage",
            "Question Answering"
        ];
        
        // Generate component test UI
        const container = document.getElementById('components');
        components.forEach((component, idx) => {
            const div = document.createElement('div');
            div.className = 'component';
            div.innerHTML = `
                <div class="name">${component}</div>
                <div class="status">
                    <input type="radio" name="status-${idx}" value="passed"> Working
                    <input type="radio" name="status-${idx}" value="failed"> Not Working
                    <input type="radio" name="status-${idx}" value="untested" checked> Not Tested
                </div>
                <textarea class="notes" placeholder="Notes (issues, concerns, etc.)"></textarea>
            `;
            container.appendChild(div);
        });
        
        // Generate report function
        function generateReport() {
            const report = document.getElementById('report');
            let reportText = "# Component Verification Report\n\n";
            
            let allPassed = true;
            const componentDivs = document.querySelectorAll('.component');
            componentDivs.forEach((div, idx) => {
                const name = div.querySelector('.name').textContent;
                const status = div.querySelector('input[type="radio"]:checked').value;
                const notes = div.querySelector('.notes').value;
                
                reportText += `## ${name}\n`;
                reportText += `Status: ${status.toUpperCase()}\n`;
                if (notes) {
                    reportText += `Notes: ${notes}\n`;
                }
                reportText += "\n";
                
                if (status !== 'passed') {
                    allPassed = false;
                }
            });
            
            reportText += allPassed ? 
                "All components verified successfully!" : 
                "⚠️ Some components failed verification - please fix before cleanup!";
            
            report.innerHTML = `<pre>${reportText}</pre>`;
            
            // Copy to clipboard
            navigator.clipboard.writeText(reportText)
                .then(() => alert("Report copied to clipboard!"))
                .catch(err => console.error("Failed to copy report: ", err));
        }
    </script>
</body>
</html>
HTML_EOF

echo "Created manual verification page at tests/manual_verification.html"
echo "Please open this page in your browser and verify each component"
echo "Then copy the generated report for your records before cleanup"
