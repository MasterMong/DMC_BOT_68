# DMC Bot 68

A Playwright-based automation bot for managing student data in the DMC (Data Management Center) system. This bot automates various administrative tasks including student existence checks, classroom assignments, and data management operations.

## 🎯 Project Goals

- **Automate DMC System Operations**: Streamline repetitive tasks in the Data Management Center portal
- **Student Data Management**: Check student existence, update classroom assignments, and manage student records
- **Bulk Operations**: Process large datasets efficiently using CSV files
- **Error Handling & Reporting**: Comprehensive logging and result reporting for all operations

## 🚀 Features

### Core Functionality
- **DMC Login Automation**: Automated login using ThaiD authentication
- **Student Existence Check**: Verify if students exist in the DMC system using CID
- **Classroom Management**: Bulk update student classroom assignments
- **School Information Access**: Navigate and manage school basic information
- **CSV Data Processing**: Load and process student data from CSV files

### Advanced Features
- **Chrome DevTools Protocol (CDP)**: Connect to existing Chrome sessions for seamless operation
- **Comprehensive Logging**: Detailed progress tracking with emojis and timestamps
- **Error Recovery**: Automatic error handling and recovery mechanisms
- **Performance Metrics**: Processing speed and execution time tracking
- **Result Export**: Export operation results to timestamped CSV files

## 📋 Prerequisites

- Node.js (v16 or higher)
- Google Chrome or Chromium browser
- DMC system account with appropriate permissions

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/DMC_BOT_68.git
   cd DMC_BOT_68
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright browsers**
   ```bash
   npx playwright install
   ```

## ⚙️ Configuration

### Environment Setup

Create a `.env` file in the root directory:

```env
# DMC Portal Configuration
DMC_PORTAL_URL=https://portal.bopp-obec.info/obec68

# School Information
SCHOOL_CODE=36022006
EDUCATION_YEAR=2568
LEVEL_DTL_CODE=14

# CSV Configuration
CSV_FILE_NAME=stu.csv
```

### CSV Data Format

#### For Student Existence Check (`stu.csv`)
```csv
studentId
1234567890123
9876543210987
```

#### For Classroom Changes (`data.csv`)
```csv
studentId,firstName,lastName,room
1234567890123,สมชาย,ใจดี,1/1
9876543210987,สมหญิง,ใจงาม,1/2
```

## 🚀 Usage

### Chrome Remote Debugging Setup

1. **Start Chrome with remote debugging**
   ```bash
   chmod +x chrome_debug_script.sh
   ./chrome_debug_script.sh
   ```

2. **Manually login to DMC** in the opened Chrome browser

### Available Commands

#### Run All Tests
```bash
npm test
```

#### Individual Operations

**Login to DMC System**
```bash
npm run test:login
```

**Check Student Existence**
```bash
npm run test:check-students
```

**Access School Information**
```bash
npm run test:school-info
```

**Change Student Classrooms**
```bash
npm run test:change-classroom
```

## 📊 Test Scenarios

### 1. DMC Login (`dmc-login.spec.ts`)
- Automated ThaiD authentication
- QR code handling
- User selection and system access
- Session validation

### 2. Student Existence Check (`dmc-check-stu-exist.spec.ts`)
- Load student CIDs from CSV
- Bulk verification against DMC system
- Performance tracking and reporting
- Export results to timestamped CSV

### 3. Classroom Management (`dmc-change-classroom.spec.ts`)
- Load student data with target classrooms
- Navigate to classroom management section
- Update student room assignments
- Track success/failure rates

### 4. School Information (`dmc-school-info.spec.ts`)
- Access school basic information page
- Verify navigation and page loading
- Template for school data operations

## 📁 Project Structure

```
DMC_BOT_68/
├── tests/
│   ├── fixtures/
│   │   └── cdp-fixtures.ts         # CDP connection setup
│   ├── dmc-login.spec.ts           # Login automation
│   ├── dmc-check-stu-exist.spec.ts # Student existence check
│   ├── dmc-change-classroom.spec.ts # Classroom management
│   ├── dmc-school-info.spec.ts     # School information access
│   └── dmc-template.spec.ts        # Template for new tests
├── src/
│   └── utils/
│       └── csv-data-handler.ts     # CSV processing utilities
├── data/                           # Input CSV files
├── output/                         # Generated reports
├── chrome_debug_script.sh          # Chrome remote debugging setup
├── playwright.config.ts            # Playwright configuration
├── package.json
└── .env                           # Environment variables
```

## 📈 Performance Metrics

The bot provides detailed performance analytics:

- **Processing Speed**: Students processed per second
- **Success Rate**: Percentage of successful operations
- **Error Tracking**: Detailed error logs with recovery attempts
- **Execution Time**: Total and per-item processing time

### Sample Output
```
📊 EXECUTION SUMMARY
==================================================
⏱️  Total execution time: 45.23s
📈 Average processing time per student: 1,250ms
👥 Total students checked: 36
✅ Found in system: 34
❌ Not found: 2
📊 Success rate: 94.44%
⚡ Processing speed: 0.80 students/second
==================================================
```

## 🔧 Troubleshooting

### Common Issues

1. **Chrome Connection Failed**
   - Ensure Chrome is running with remote debugging
   - Check if port 9222 is available
   - Restart the chrome_debug_script.sh

2. **CSV File Not Found**
   - Verify CSV file exists in `/data` directory
   - Check CSV_FILE_NAME in .env file
   - Ensure proper CSV format

3. **DMC Login Issues**
   - Manually login first in Chrome browser
   - Check if session is still active
   - Verify DMC_PORTAL_URL in .env

4. **Network Timeouts**
   - Increase timeout values in test files
   - Check internet connection stability
   - Consider adding delays between requests

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the Playwright documentation for advanced configurations

## 🔮 Future Enhancements

- [ ] Web-based dashboard for monitoring operations
- [ ] Advanced error recovery mechanisms
- [ ] Support for multiple school configurations
- [ ] Real-time progress tracking
- [ ] Integration with external databases
- [ ] Automated scheduling and cron job support

---

**Note**: This bot is designed for educational administration purposes. Ensure you have proper authorization before using it with any DMC system.
