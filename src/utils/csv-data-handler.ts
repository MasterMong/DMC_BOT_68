import * as fs from 'fs';
import * as path from 'path';

export interface StudentRecord {
  schoolCode: string;
  schoolName: string;
  studentId: string;
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
      console.warn('Could not load data dictionary from file, using default:', error.message);
      return this.initializeDataDictionary();
    }
  }

  private initializeDataDictionary(): DataDictionary {
    return {
      schoolCode: {
        thaiName: 'รหัสโรงเรียน',
        englishName: 'School Code',
        type: 'string',
        required: true,
        description: 'Unique identifier for the school',
        example: '36022006'
      },
      schoolName: {
        thaiName: 'ชื่อโรงเรียน',
        englishName: 'School Name',
        type: 'string',
        required: true,
        description: 'Name of the school',
        example: 'ภูเขียว'
      },
      studentId: {
        thaiName: 'เลขประจำตัวนักเรียน',
        englishName: 'Student ID',
        type: 'string',
        required: true,
        description: 'National ID number of the student',
        example: '1368400145149'
      },
      grade: {
        thaiName: 'ชั้น',
        englishName: 'Grade',
        type: 'string',
        required: true,
        description: 'Student grade level',
        example: 'ม.2'
      },
      room: {
        thaiName: 'ห้อง',
        englishName: 'Room',
        type: 'string',
        required: true,
        description: 'Classroom number',
        example: '5'
      },
      gender: {
        thaiName: 'เพศ',
        englishName: 'Gender',
        type: 'string',
        required: true,
        description: 'Student gender',
        example: 'ญ'
      },
      titlePrefix: {
        thaiName: 'คำนำหน้าชื่อ',
        englishName: 'Title Prefix',
        type: 'string',
        required: true,
        description: 'Title prefix',
        example: 'เด็กหญิง'
      },
      firstName: {
        thaiName: 'ชื่อ',
        englishName: 'First Name',
        type: 'string',
        required: true,
        description: 'First name',
        example: 'เกวลิน'
      },
      lastName: {
        thaiName: 'นามสกุล',
        englishName: 'Last Name',
        type: 'string',
        required: true,
        description: 'Last name',
        example: 'เฝ้าทรัพย์'
      },
      birthDate: {
        thaiName: 'วันเกิด',
        englishName: 'Birth Date',
        type: 'date',
        required: true,
        description: 'Birth date',
        example: '20/03/2555'
      },
      age: {
        thaiName: 'อายุ(ปี)',
        englishName: 'Age',
        type: 'number',
        required: false,
        description: 'Age in years',
        example: '13'
      },
      weight: {
        thaiName: 'น้ำหนัก',
        englishName: 'Weight',
        type: 'number',
        required: false,
        description: 'Weight',
        example: '0'
      },
      height: {
        thaiName: 'ส่วนสูง',
        englishName: 'Height',
        type: 'number',
        required: false,
        description: 'Height',
        example: '0'
      },
      bloodType: {
        thaiName: 'กลุ่มเลือด',
        englishName: 'Blood Type',
        type: 'string',
        required: false,
        description: 'Blood type',
        example: 'B'
      },
      religion: {
        thaiName: 'ศาสนา',
        englishName: 'Religion',
        type: 'string',
        required: false,
        description: 'Religion',
        example: 'พุทธ'
      },
      ethnicity: {
        thaiName: 'เชื้อชาติ',
        englishName: 'Ethnicity',
        type: 'string',
        required: false,
        description: 'Ethnicity',
        example: 'ไทย'
      },
      nationality: {
        thaiName: 'สัญชาติ',
        englishName: 'Nationality',
        type: 'string',
        required: false,
        description: 'Nationality',
        example: 'ไทย'
      },
      houseNumber: {
        thaiName: 'บ้านเลขที่',
        englishName: 'House Number',
        type: 'string',
        required: false,
        description: 'House number',
        example: '307'
      },
      village: {
        thaiName: 'หมู่',
        englishName: 'Village',
        type: 'string',
        required: false,
        description: 'Village',
        example: '1'
      },
      street: {
        thaiName: 'ถนน/ซอย',
        englishName: 'Street',
        type: 'string',
        required: false,
        description: 'Street',
        example: '-'
      },
      subdistrict: {
        thaiName: 'ตำบล',
        englishName: 'Subdistrict',
        type: 'string',
        required: false,
        description: 'Subdistrict',
        example: 'กวางโจน'
      },
      district: {
        thaiName: 'อำเภอ',
        englishName: 'District',
        type: 'string',
        required: false,
        description: 'District',
        example: 'ภูเขียว'
      },
      province: {
        thaiName: 'จังหวัด',
        englishName: 'Province',
        type: 'string',
        required: false,
        description: 'Province',
        example: 'ชัยภูมิ'
      },
      guardianFirstName: {
        thaiName: 'ชื่อผู้ปกครอง',
        englishName: 'Guardian First Name',
        type: 'string',
        required: false,
        description: 'Guardian first name',
        example: 'มนฤดี'
      },
      guardianLastName: {
        thaiName: 'นามสกุลผู้ปกครอง',
        englishName: 'Guardian Last Name',
        type: 'string',
        required: false,
        description: 'Guardian last name',
        example: 'เฝ้าทรัพย์'
      },
      guardianOccupation: {
        thaiName: 'อาชีพของผู้ปกครอง',
        englishName: 'Guardian Occupation',
        type: 'string',
        required: false,
        description: 'Guardian occupation',
        example: 'รับจ้าง'
      },
      guardianRelation: {
        thaiName: 'ความเกี่ยวข้องของผู้ปกครองกับนักเรียน',
        englishName: 'Guardian Relation',
        type: 'string',
        required: false,
        description: 'Guardian relation',
        example: 'มารดา'
      },
      fatherFirstName: {
        thaiName: 'ชื่อบิดา',
        englishName: 'Father First Name',
        type: 'string',
        required: false,
        description: 'Father first name',
        example: 'ศิริชัย'
      },
      fatherLastName: {
        thaiName: 'นามสกุลบิดา',
        englishName: 'Father Last Name',
        type: 'string',
        required: false,
        description: 'Father last name',
        example: 'เฝ้าทรัพย์'
      },
      fatherOccupation: {
        thaiName: 'อาชีพของบิดา',
        englishName: 'Father Occupation',
        type: 'string',
        required: false,
        description: 'Father occupation',
        example: 'รับจ้าง'
      },
      motherFirstName: {
        thaiName: 'ชื่อมารดา',
        englishName: 'Mother First Name',
        type: 'string',
        required: false,
        description: 'Mother first name',
        example: 'มนฤดี'
      },
      motherLastName: {
        thaiName: 'นามสกุลมารดา',
        englishName: 'Mother Last Name',
        type: 'string',
        required: false,
        description: 'Mother last name',
        example: 'เฝ้าทรัพย์'
      },
      motherOccupation: {
        thaiName: 'อาชีพของมารดา',
        englishName: 'Mother Occupation',
        type: 'string',
        required: false,
        description: 'Mother occupation',
        example: 'รับจ้าง'
      },
      disadvantaged: {
        thaiName: 'ความด้อยโอกาส',
        englishName: 'Disadvantaged',
        type: 'string',
        required: false,
        description: 'Disadvantaged status',
        example: 'เด็กยากจน'
      },
      unresolved: {
        thaiName: 'ยังไม่สามารถจำหน่ายได้ (3.1.8)',
        englishName: 'Unresolved',
        type: 'string',
        required: false,
        description: 'Unresolved status',
        example: '-'
      }
    };
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
        studentId: values[2] || '',
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
    return students.map(student => student.studentId).filter(id => id.trim() !== '');
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
    
    if (!student.studentId || student.studentId.trim() === '') {
      errors.push('Student ID is required');
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
