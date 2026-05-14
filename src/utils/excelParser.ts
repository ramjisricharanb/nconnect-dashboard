import * as XLSX from 'xlsx';

export interface ModuleData {
  id: string;
  name: string;
  status: string;
  feature: string;
  category: string; // 'On Going', 'Recently Deployed', 'Up Coming'
}

export interface DashboardData {
  modules: ModuleData[];
  kpi: {
    ongoing: number;
    deployed: number;
    upcoming: number;
  };
}

export function parseExcelBuffer(buffer: ArrayBuffer): Promise<DashboardData> {
  return new Promise((resolve, reject) => {
    try {
      const data = new Uint8Array(buffer);
      const workbook = XLSX.read(data, { type: 'array' });
      
      const targetSheets = {
        'On Going': 'ongoing',
        'Recently Deployed': 'deployed',
        'Up Coming': 'upcoming'
      };

      const modules: ModuleData[] = [];
      const kpi = { ongoing: 0, deployed: 0, upcoming: 0 };

      const sheetNames = workbook.SheetNames;
      
      Object.entries(targetSheets).forEach(([expectedName, kpiKey]) => {
        // Find the actual sheet name that matches the expected one (case-insensitive)
        const actualSheetName = sheetNames.find(sn => sn.toLowerCase() === expectedName.toLowerCase());
        
        if (actualSheetName) {
          const worksheet = workbook.Sheets[actualSheetName];
          const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          
          // Note: Filter out empty rows when counting KPIs
          let count = 0;

          json.forEach((row, index) => {
            const keys = Object.keys(row);
            const getCol = (possible: string[]) => keys.find(k => possible.some(p => k.toLowerCase().includes(p)));
            
            const nameCol = getCol(['module', 'name', 'title']) || keys[0];
            const featureCol = getCol(['feature', 'requirement', 'description', 'update']) || keys[1];
            const statusCol = getCol(['status', 'state']) || keys[2];

            const name = row[nameCol];
            if (name && String(name).trim() !== '') {
              count++;
              modules.push({
                id: `${kpiKey}-${index}`,
                name: String(name),
                feature: String(row[featureCol] || ''),
                status: String(row[statusCol] || 'Tasks'),
                category: expectedName
              });
            }
          });
          
          kpi[kpiKey as keyof typeof kpi] = count;
        }
      });

      resolve({ modules, kpi });
    } catch (error) {
      reject(error);
    }
  });
}

export async function parseExcelData(file: File): Promise<DashboardData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        if (e.target?.result) {
          const result = await parseExcelBuffer(e.target.result as ArrayBuffer);
          resolve(result);
        } else {
          reject(new Error('File reader returned empty result'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
