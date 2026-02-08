# 🏥 PrescribeCorrect - AI-Powered Medical Prescription Analysis Platform

## 🎯 Project Overview

As we all know that doctors have illegible handwriting and it is difficult for individuals from non-medical background to understand the disease and the medicines mentioned in the report. Most of the times, even pharmacists find it difficult to decipher the handwriting written in medical reports. This is the problem we have been observing from decades and many have suffered due to this problem. In the modern era, few doctors have started to provide digitized prescriptions to maintain records, but most doctors still provide traditionally handwritten prescriptions on their printed letterhead. This is one of the main reasons we want to work on this problem.

Moreover, it is difficult to store and access physical documents in an efficient manner, search through them efficiently and to share them with others. Thus, a lot of important data gets lost or does not get reviewed because documents(prescription) never get transferred to digital format. This is another reason for us to work on this problem.

There are many existing models which convert handwritten images to digital text, but our aim is to go an extra mile and identify the keywords or medical terms from the prescriptions such as the disease, medicines prescribed, medical tests suggested, etc.

### 🌟 Key Highlights

- **✍️ Advanced Handwritten Text Recognition (HTR)**: Custom fine-tuned HTR model trained on real prescription samples to accurately decode handwritten medicines
- **🤖 AI-Powered Analysis**: Fine-tuned Google Gemini model on conversation dataset
- **🌏 Bilingual Support**: Complete English and Bengali language integration
- **📱 Multi-Platform**: Responsive web application with mobile-first design
- **🔒 Secure & Compliant**: HIPAA-compliant security measures and data protection
- **⚡ Real-time Processing**: Instant prescription analysis and medical consultations
- **👨‍⚕️ Healthcare Professional Portal**: Dedicated interfaces for doctors and medical staff

---

## 📋 Software Requirements Specification (SRS)

### 🎯 Purpose

MediBot to bridge the communication gap between healthcare providers and patients in Bangladesh by providing:
- Accurate prescription decoding
- Intelligent patient question answering (Fine-tune with dataset)
- AI-powered health consultations
- Comprehensive medical record management

### 🔍 Scope

#### Functional Requirements

##### 🏥 Core Medical Features
- **FR-001**: Prescription Image Upload and Processing
- **FR-002**: Advanced HTR with Medical Text Recognition
- **FR-003**: AI-Powered Medical Analysis and Interpretation
- **FR-004**: Bengali-English Medical Translation
- **FR-005**: Drug Interaction and Allergy Checking
- **FR-006**: Medical Consultation Chat System
- **FR-007**: Analysis History and Report Generation

##### 👤 User Management
- **FR-008**: Multi-role Authentication (Patient, Doctor, Admin)
- **FR-009**: User Profile Management
- **FR-010**: Doctor Verification and Approval System
- **FR-011**: Patient Medical History Tracking

##### 📊 Administrative Features
- **FR-012**: Admin Dashboard with Analytics
- **FR-013**: User Activity Monitoring
- **FR-014**: System Performance Metrics
- **FR-015**: Data Export and Reporting

## 🏗️ System Architecture

### 🏛️ High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser] --> B[Next.js Frontend]
        C[Mobile Browser] --> B
    end
    
    subgraph "Application Layer"
        B --> D[Next.js API Routes]
        D --> E[Authentication Service]
        D --> F[Prescription Analysis Service]
        D --> G[Chat Service]
    end
    
    subgraph "AI/ML Layer"
        F --> H[Google Gemini API]
        F --> I[Tesseract.js OCR]
        F --> J[Fine-tuned Medical Model]
    end
    
    subgraph "Backend Services"
        D --> K[Spring Boot API]
        K --> L[JWT Authentication]
        K --> M[PostgreSQL Database]
    end
    
    subgraph "External Services"
        H --> O[Google AI Platform]
    end
    
    subgraph "Storage Layer"
        M --> P[(User Data)]
        M --> Q[(Medical Records)]
        M --> R[(Analysis History)]
    end
```

### 🔧 Component Architecture

```mermaid
graph LR
    subgraph "Frontend Components"
        A[Navigation] --> B[Hero Section]
        A --> C[Upload Component]
        A --> D[Analysis Display]
        A --> E[Chat Interface]
        A --> F[Profile Management]
    end
    
    subgraph "Backend Components"
        G[Controllers] --> H[Services]
        H --> I[Repositories]
        I --> J[Entities]
    end
    
    subgraph "AI Components"
        K[OCR Engine] --> L[Text Preprocessing]
        L --> M[Medical NLP]
        M --> N[Response Generation]
    end
```

---

## 🚀 Features

### 🏥 Medical Analysis Features

#### 📄 Advanced Prescription Analysis
- **Medical Text Recognition**: Specialized recognition for medical handwriting
- **Drug Information**: Comprehensive drug database with Bengali translations
- **Dosage Interpretation**: Intelligent parsing of dosage instructions
- **Interaction Warnings**: Real-time drug interaction checking

#### 🩺 Health Consultation
- **AI Medical Chat**: 24/7 medical consultation chatbot
- **Symptom Analysis**: Intelligent symptom checker with recommendations
- **Health Tips**: Personalized health recommendations
- **Bengali Support**: Complete consultation in Bengali language

### � User Management Features

#### 🔐 Authentication & Authorization
- **Multi-Role System**: Patient, Doctor, Admin roles
- **Secure Login**: JWT-based authentication with Spring Security
- **Profile Management**: Comprehensive user profile system
- **Doctor Verification**: Medical license verification system

#### 📊 Data Management
- **Analysis History**: Complete history of all prescription analyses
- **Medical Records**: Secure storage of patient medical information
- **Report Generation**: PDF report generation for medical analyses
- **Data Export**: Export functionality for personal health records

### 📱 User Interface Features

#### 🎨 Modern Design
- **Responsive Design**: Mobile-first responsive interface
- **Dark/Light Mode**: Theme switching capability
- **Accessibility**: WCAG 2.1 AA compliant design
- **Bengali Typography**: Proper Bengali font rendering

#### ⚡ Performance Features
- **Lazy Loading**: Component-based lazy loading
- **Image Optimization**: Automatic image compression and optimization
- **Caching**: Intelligent caching for better performance
- **Progressive Web App**: PWA capabilities for mobile installation

---


### 🎨 Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.4.6 | React framework with SSR/SSG |
| **React** | 19.1.0 | UI component library |
| **TypeScript** | 5.8.3 | Type-safe JavaScript |
| **Tailwind CSS** | 3.4.0 | Utility-first CSS framework |
| **DaisyUI** | 5.0.46 | Tailwind CSS components |
| **Framer Motion** | 12.23.12 | Animation library |
| **Lucide React** | 0.536.0 | Icon library |
| **Tesseract.js** | 6.0.1 | Client-side OCR engine |

### ⚙️ Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Spring Boot** | 3.5.3 | Java backend framework |
| **Spring Security** | Latest | Authentication & authorization |
| **Spring Data JPA** | Latest | Database abstraction layer |
| **PostgreSQL** | Latest | Primary database |
| **JWT** | 0.11.5 | Token-based authentication |
| **Lombok** | 1.18.38 | Java boilerplate reduction |

### 🤖 AI/ML Technologies

| Technology    | Purpose |
|------------   |---------|
| **HTR model** | Model for hand written prescription analysis |
| **Gemini** | Model for better response |
| **Python**    |ML model training and fine-tuning |

---

## ⚙️ Installation & Setup

### 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **Python** (v3.8 or higher)
- **Java JDK** (v17 or higher)
- **PostgreSQL** (v13 or higher)
- **Git** (latest version)

### 🔄 Complete System Flow

```mermaid
flowchart TD
    A[User Uploads Prescription] --> B{Image Validation}
    B -->|Valid| C[Image Preprocessing]
    B -->|Invalid| D[Error: Invalid Image]
    
    C --> E[OCR Text Extraction]
    E --> F[Text Preprocessing]
    F --> G[Medical Term Recognition]
    
    G --> H[AI Analysis with Gemini]
    H --> I[Medical Information Extraction]
    I --> J[Bengali Translation]
    
    J --> K[Drug Interaction Check]
    K --> L[Dosage Validation]
    L --> M[Generate Analysis Report]
    
    M --> N[Save to Database]
    N --> O[Return Results to User]
    O --> P[Display Analysis]
    
    P --> Q{User Action}
    Q -->|Chat| R[Medical Consultation]
    Q -->|Download| S[Generate PDF Report]
    Q -->|Share| T[Share with Doctor]
```

### 🔐 Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    
    U->>F: Login Request
    F->>B: Authenticate User
    B->>DB: Validate Credentials
    DB->>B: User Data
    B->>F: JWT Token
    F->>U: Login Success
    
    Note over U,DB: User is now authenticated
    
    U->>F: API Request + JWT
    F->>B: Forward Request
    B->>B: Validate JWT
    B->>DB: Process Request
    DB->>B: Data Response
    B->>F: API Response
    F->>U: Display Data
```
--- 

## 👥 User Roles & Access Control

### 🔐 Role-Based Access System

#### 👤 Regular User (Patient)
- ✅ Upload prescription images
- ✅ Get detailed medical analysis
- ✅ Chat with medical AI
- ✅ View analysis history
- ✅ Download analysis reports
- ❌ Access admin features
- ❌ Approve doctor registrations

#### 👨‍⚕️ Doctor
- ✅ All patient features
- ✅ Register and manage professional profile
- ✅ Access patient consultations
- ✅ Provide medical advice through platform
- ✅ View aggregated health statistics
- ❌ Access admin features
- ❌ Manage other users

#### 👨‍💼 Admin
- ✅ All user features
- ✅ Approve/reject doctor registrations
- ✅ Manage user accounts
- ✅ System oversight and monitoring
- ✅ Access analytics dashboard
- ✅ Configure system settings

---

</div>













