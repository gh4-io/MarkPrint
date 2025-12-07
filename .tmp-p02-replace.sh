#!/bin/bash
# P0-2: Replace console.* calls with debugLogger in extension.js

cd /mnt/c/Users/Jason/Documents/Git/MarkPrint

# Line 358: markprint() error
sed -i "358s|console.error('markprint()', error && error.message ? error.message : error);|debugLogger.log('error', 'markprint() error', { error: error && error.message ? error.message : error });|" extension.js

# Line 881: exportPdf() error
sed -i "881s|console.error('exportPdf()', error && error.message ? error.message : error);|debugLogger.log('error', 'exportPdf() error', { error: error && error.message ? error.message : error });|" extension.js

# Line 921: warn error.message
sed -i "921s|console.warn(error.message);|debugLogger.log('warn', 'Error occurred', { error: error.message });|" extension.js

# Line 934: Directory does not exist
sed -i "934s|console.warn('Directory does not exist!') ;|debugLogger.log('warn', 'Directory does not exist');|" extension.js

# Line 938: warn error.message
sed -i "938s|console.warn(error.message);|debugLogger.log('warn', 'Error occurred', { error: error.message });|" extension.js

# Line 1343: Failed to inline stylesheet
sed -i "1343s|console.warn('Failed to inline stylesheet:', error.message);|// Already using debugLogger - skip|" extension.js

# Line 1439: Chromium downloaded
sed -i "1439s|console.log('Chromium downloaded to ' + revisionInfo.folderPath);|debugLogger.log('chromium', 'Chromium downloaded', { path: revisionInfo.folderPath });|" extension.js

# Lines 1479-1482: error formatting (showErrorMessage function)
sed -i "1479s|console.error(formatted);|debugLogger.log('error', formatted);|" extension.js
sed -i "1480s|console.error(error.stack);|debugLogger.log('error', 'Stack trace', { stack: error.stack });|" extension.js
sed -i "1482s|console.error(formatted);|debugLogger.log('error', formatted);|" extension.js

echo "Replacements complete"
