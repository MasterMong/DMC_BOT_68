import * as fs from 'fs';
import * as path from 'path';

export interface StudentRecord {
  schoolCode: string;
  schoolName: string;
  studentCid: string;
  grade: string;
  room: string;
  studentNumber: string;
  gender: string;
  titlePrefix: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  age: number;
  weight: number;
  height: number;
  bloodType: string;
  religion: string;
  ethnicity: string;
  nationality: string;
  houseNumber: string;
  village: string;
  street: string;
  subdistrict: string;
  district: string;
  province: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianOccupation: string;
  guardianRelation: string;
  fatherFirstName: string;
  fatherLastName: string;
  fatherOccupation: string;
  motherFirstName: string;
  motherLastName: string;
  motherOccupation: string;
  disadvantaged: string;
  unresolved: string;
}

export interface DataDictionary {
  [key: string]: {
    thaiName: string;
    englishName: string;
    type: 'string' | 'number' | 'date';
    required: boolean;
    description: string;
    example?: string;
  };
}

export class CsvDataHandler {
  private static instance: CsvDataHandler;
  private dataDictionary: DataDictionary;

  private constructor() {
    this.dataDictionary = this.loadDataDictionary();
  }

  public static getInstance(): CsvDataHandler {
    if (!CsvDataHandler.instance) {
      CsvDataHandler.instance = new CsvDataHandler();
    }
    return CsvDataHandler.instance;
  }

  private loadDataDictionary(): DataDictionary {
    try {
      const dictionaryPath = path.join(__dirname, '../config/data-dictionary.json');
      const dictionaryContent = fs.readFileSync(dictionaryPath, 'utf-8');
      const dictionaryData = JSON.parse(dictionaryContent);
      
      const dictionary: DataDictionary = {};
      for (const [key, value] of Object.entries(dictionaryData.fields)) {
        dictionary[key] = value as any;
      }
      
      return dictionary;
    } catch (error) {
      console.error('Could not load data dictionary from file:', error.message);
      throw new Error(`Failed to load data dictionary: ${error.message}`);
    }
  }

  public loadStudentData(csvFilePath: string): StudentRecord[] {
    try {
      const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      
      const students: StudentRecord[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',');
        if (values.length !== headers.length) continue;
        
        const student = this.mapRowToStudent(values);
        if (student) {
          students.push(student);
        }
      }
      
      return students;
    } catch (error) {
      throw new Error(`Error loading CSV file: ${error.message}`);
    }
  }

  private mapRowToStudent(values: string[]): StudentRecord | null {
    try {
      return {
        schoolCode: values[0] || '',
        schoolName: values[1] || '',
        studentCid: values[2] || '',
        grade: values[3] || '',
        room: values[4] || '',
        studentNumber: values[5] || '',
        gender: values[6] || '',
        titlePrefix: values[7] || '',
        firstName: values[8] || '',
        lastName: values[9] || '',
        birthDate: values[10] || '',
        age: parseInt(values[11]) || 0,
        weight: parseInt(values[12]) || 0,
        height: parseInt(values[13]) || 0,
        bloodType: values[14] || '',
        religion: values[15] || '',
        ethnicity: values[16] || '',
        nationality: values[17] || '',
        houseNumber: values[18] || '',
        village: values[19] || '',
        street: values[20] || '',
        subdistrict: values[21] || '',
        district: values[22] || '',
        province: values[23] || '',
        guardianFirstName: values[24] || '',
        guardianLastName: values[25] || '',
        guardianOccupation: values[26] || '',
        guardianRelation: values[27] || '',
        fatherFirstName: values[28] || '',
        fatherLastName: values[29] || '',
        fatherOccupation: values[30] || '',
        motherFirstName: values[31] || '',
        motherLastName: values[32] || '',
        motherOccupation: values[33] || '',
        disadvantaged: values[34] || '',
        unresolved: values[35] || ''
      };
    } catch (error) {
      console.error('Error mapping row to student:', error);
      return null;
    }
  }

  public getStudentIds(csvFilePath: string): string[] {
    const students = this.loadStudentData(csvFilePath);
    return students.map(student => student.studentCid).filter(id => id.trim() !== '');
  }

  public filterStudentsByGrade(students: StudentRecord[], grade: string): StudentRecord[] {
    return students.filter(student => student.grade === grade);
  }

  public filterStudentsByRoom(students: StudentRecord[], room: string): StudentRecord[] {
    return students.filter(student => student.room === room);
  }

  public getDataDictionary(): DataDictionary {
    return this.dataDictionary;
  }

  public validateStudentRecord(student: StudentRecord): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!student.studentCid || student.studentCid.trim() === '') {
      errors.push('National ID is required');
    } else if (!/^[0-9]{13}$/.test(student.studentCid)) {
      errors.push('National ID must be 13 digits');
    }
    
    if (!student.studentNumber || student.studentNumber.trim() === '') {
      errors.push('Student number is required');
    }
    
    if (!student.firstName || student.firstName.trim() === '') {
      errors.push('First name is required');
    }
    
    if (!student.lastName || student.lastName.trim() === '') {
      errors.push('Last name is required');
    }
    
    if (!student.schoolCode || student.schoolCode.trim() === '') {
      errors.push('School code is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public exportToCsv(students: StudentRecord[], outputPath: string): void {
    const headers = Object.keys(this.dataDictionary);
    const thaiHeaders = headers.map(key => this.dataDictionary[key].thaiName);
    const csvContent = thaiHeaders.join(',') + '\n' +
      students.map(student => 
        headers.map(header => student[header as keyof StudentRecord] || '').join(',')
      ).join('\n');
    
    fs.writeFileSync(outputPath, csvContent, 'utf-8');
  }

  public getFieldInfo(fieldKey: string): any {
    return this.dataDictionary[fieldKey];
  }

  public getColumnCount(): number {
    return Object.keys(this.dataDictionary).length;
  }

  public getRequiredFields(): string[] {
    return Object.keys(this.dataDictionary).filter(key => this.dataDictionary[key].required);
  }
}
