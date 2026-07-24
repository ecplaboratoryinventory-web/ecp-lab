#### **ECP: A WEB-APP ENGINEERING LABORATORY MANAGEMENT SYSTEM FOR STI COLLEGE COTABATO** 

A Capstone Project Proposal Presented to the Faculty of the Information and Communications Technology Program STI College Cotabato 

In Partial Fulfilment of the Requirements for the Degree Bachelor of Science in Information Technology 

Marjuan S. Eting Jhon Michael L. Jumaani Bin Fhaeid B. Mambao 

**MAY 2026** 

_STI College Cotabato_ 

1 

##### **ENDORSEMENT FORM FOR PROPOSAL DEFENSE** 

**TITLE OF RESEARCH:** ECP: A Web-App Engineering Laboratory Management System for STI College Cotabato 

**NAME OF PROPONENTS:** 

Marjuan S.  Eting Jhon Michael L. Jumaani Bin Fhaeid B. Mambao 

In Partial Fulfilment of the Requirements for the degree Bachelor of Science in Information Technology has been examined and is recommended for Proposal Defense. 

##### **ENDORSED BY:** 

Ms. Almirah E. Abang **Capstone Project Adviser** 

##### **APPROVED FOR PROPOSAL DEFENSE:** 

Engr. Roland Carl A. Denopol, PCpe **Capstone Project Coordinator** 

##### **NOTED BY:** 

Engr. Jovan J. Edward, PCpe **Program Head** 

**MAY 2026** 

_STI College Cotabato_ 

2 

##### **APPROVAL SHEET** 

This capstone project proposal titled **ECP: A Web-App Engineering Laboratory Management System for STI College Cotabato** , prepared and submitted by **Marjuan S. Eting, Jhon Michael L. Jumaani, and Bin Fhaeid B. Mambao** , in partial fulfillment of the requirements for the degree of Bachelor of Science in Information Technology, has been examined and is recommended for acceptance and approval. 

**Ms. Almirah E. Abang** Capstone Project Adviser 

Accepted and approved by the Capstone Project Review Panel in partial fulfillment of the requirements for the degree of Bachelor of Science in Information Technology 

<Panelist's Given Name MI. Family Name> <Panelist's Given Name MI. Family Name> **Panel Member Panel Member** 

Engr. Roland Carl A. Denopol, PCpe **Lead Panelist** 

##### **Noted:** 

Engr. Roland Carl A. Denopol, PCpe **Capstone Project Coordinator** 

Engr. Jovan J. Edward, PCpe **Program Head** 

**MAY 2026** 

_STI College Cotabato_ 

3 

##### **TABLE OF CONTENTS** 

||**Page**|
|---|---|
|**Title Page**……………………………………………………………|…….**I**|
|**Endorsement form for Proposal Defense**…………………………|…….<br>**II**|
|**Approval Sheet**……………………………………………………|………<br>**III**|
|**Table of Contents**……………………………………………………|…….**IV**|
|**Introduction**|**1**|
|Project Context …………………………………………………|…….<br>**1**|
|Purpose and Description ………………………………………|……<br>**3**|
|Objectives ………………………………………………………|…….**4**|
|Scope and Limitations …………………………………………|……..<br>**6**|
|Review of Related Literature/Studies/Systems ………………|………<br>**9**|
|**Methodology**|**13**|
|Technical Background   …………………………………………|…….<br>**15**|
|Calendar of Activities   …………………………………………|…….<br>**20**|
|Requirements Analysis   …………………………………………|…….**28**|
|Requirements Documentation   …………………………………|……..<br>**31**|
|Design of Software, System, Product, and/or Processes   ………|…….<br>**35**|
|**References**…………………………………………………………|………<br>**45**|
|**Appendices**|**46**|
|Resource Persons ………………………………………………|…….<br>**47**|



_STI College Cotabato_ 

4 

_STI College Cotabato_ 

5 

##### **INTRODUCTION** 

##### **PROJECT CONTEXT** 

Engineering and science laboratories are essential components of technical and higher education, providing students and faculty with the necessary equipment and tools for practical learning, experimentation, and skills development. Effective management of laboratory resources is critical to ensure availability, proper accountability, and efficient use. However, many institutions still rely on outdated or manual systems such as paper logbooks, spreadsheets, or legacy software, which often result in inaccurate records, unaccounted-for borrowing transactions, and poor monitoring of equipment conditions. 

In the Philippines, the Commission on Higher Education (CHED) mandates that higher education institutions to maintain functional, well-managed laboratory facilities to meet program accreditation requirements. However, many local colleges still manage laboratory equipment manually or rely on outdated systems that cannot meet modern academic needs. The lack of a centralized digital platform leads to equipment loss, transaction delays, and limited visibility into equipment availability and status. 

STI College Cotabato, a private higher education institution offering technology-based programs including Bachelor of Science in Computer Engineering (BSCpE) and, the Science, Technology, Engineering, and Mathematics (STEM) strand, currently relies on an  outdated system for managing its Engineering Laboratory. This system cannot to efficiently track equipment records, process borrowing and returning transactions with proper documentation, monitor equipment conditions, and notify users of transaction updates. As a result, laboratory management is burdened with inefficiencies that affect both faculty and student operations. 

This project proposes the development of ECP: A Web-App Engineering Laboratory Management System for STI College Cotabato. The system is designed as a hybrid platform consisting of a web application for the Administrator/Laboratory Custodian, and 

_STI College Cotabato_ 

1 

a mobile application for Faculty and Students. It provides a centralized and interactive environment that digitizes equipment and inventory records, automates borrowing and returning workflows, monitors equipment condition, and delivers immediate in-app and push notifications to users. 

_STI College Cotabato_ 

2 

##### **PURPOSE AND DESCRIPTION** 

The ECP system is designed to improve and modernize the existing laboratory management process currently implemented at STI College Cotabato. It functions as an integrated web and mobile application system that supports centralized transaction processing, user interaction, and laboratory operations management. 

The system consists of two main platforms: a web application used by the Administrator/Laboratory Custodian and Designated Faculty to manage laboratory equipment, monitor inventory, review and approve or reject borrowing requests, post announcements, and generate reports; and a mobile application used by Faculty and Students — Faculty to review and approve/reject borrowing requests, monitor equipment, and receive announcements on the go, and Students to browse available equipment, submit borrowing requests, track transaction status, and receive announcements. 

The system is accessible via a standard web browser on both desktop and mobile devices, with no additional software installation require. It is designed to serve the students and faculty of the BSCpE and STEM programs at STI College Cotabato. 

_STI College Cotabato_ 

3 

##### **Objectives** 

The main objective of this study is to design and develop a web and mobile-based Engineering Laboratory Management System for STI College Cotabato that automates equipment inventory, borrowing and returning transactions, notification processes, and user management for students, faculty, and the laboratory administrator/custodian. 

Specifically, the project aims: 

- **To develop an equipment and inventory management module** that allows efficient recording, updating, categorizing, and monitoring of laboratory equipment. 

- **To design and implement a borrowing and returning management module** for processing equipment requests, approvals, returns, and transaction tracking. 

- **To implement an equipment condition and damage monitoring feature** for recording equipment status and managing damage reports linked to borrowing transactions. 

- **To implement role-based user and access management** for Laboratory Custodian, Designated Faculty, and Students. 

- **To develop a notification system** for providing in-app updates regarding borrowing requests, approvals, rejections, and transaction activities. 

- **To develop a Mobile Application for Faculty and Students** , providing Faculty with borrowing request review and approval, equipment monitoring, and announcement access, and providing Students with equipment browsing, request submission, status tracking, notifications, and announcement access. 

_STI College Cotabato_ 

4 

- **To implement an announcement feature** that allows the Laboratory Custodian to post updates and important information, visible to Faculty and Student users through their respective dashboards. 

- **To develop a Laboratory Custodian dashboard with inventory monitoring and report generation** for tracking equipment availability, borrowing activities, active transactions, overdue items, and equipment status. 

- **To implement subject-based equipment filtering** , using student subject/course enrollment data to restrict equipment visibility to what is relevant to each student. 

_STI College Cotabato_ 

5 

##### **Scope and Limitations** 

##### **Scope** 

The study focuses on the design and development of ECP: A Web-App Engineering Laboratory Management System for STI College Cotabato. The system is a hybrid platform consisting of a web application for Administrator/Laboratory Custodian and Designated Faculty, and a mobile application for Faculty and Students. The system is designed to improve monitoring of laboratory equipment, management of borrowing, and transaction tracking within the institution. 

The scope of the system includes the following: 

##### **● Equipment and Inventory Management** 

The system allows the Laboratory Custodian to manage laboratory equipment records, including equipment name, category, quantity, condition, and availability status. The system also supports equipment categorization and inventory monitoring. 

##### **● Borrowing and Returning Management** 

Students submit borrowing requests through the mobile application, while the Laboratory Custodian and Designated Faculty review and approve or reject requests through the web application. The system records borrowing details, return transactions, return dates, and transaction history. 

##### **● Equipment Condition and Damage Monitoring** 

The system records equipment condition during return transactions and supports damage reporting linked to borrowing records and responsible users. 

##### **● User and Access Management** 

_STI College Cotabato_ 

6 

Role-based access control is implemented for three user roles: Administrator/Laboratory Custodian, Designated Faculty, and Student. The Laboratory Custodian manages user accounts and student records, including batch upload of student information. 

##### **● Notification System** 

The system provides in-app notifications updates borrowing requests, approvals, rejections, return reminders, and transaction-related activities. 

##### ● **Faculty and Student Mobile Application** 

Faculty can review, approve, and reject borrowing requests, monitor equipment and inventory, and receive announcements through the mobile application. Students can browse available equipment, submit borrowing requests, view request status, receive notifications and announcements, and monitor borrowing records. Equipment browsing on the mobile application is filtered by the student's enrolled subject or course. 

##### ● **Announcement Management** 

The system allows the Laboratory Custodian to create and manage announcements, which are displayed on the Faculty web dashboard and the Student mobile application dashboard to keep users informed of important updates. 

##### **● Laboratory Custodian (Admin) Dashboard and Monitoring** 

A dashboard for tracking equipment availability, borrowing activities, active transactions, overdue items, and equipment status. 

_STI College Cotabato_ 

7 

##### **Limitations** 

While the project aims to provide an efficient and centralized laboratory management system, there are certain limitations in terms of platform support, system integration, and operational dependency that are beyond the scope of the study. 

##### ● **Internet Dependency** 

The system requires a stable internet connection for transaction processing, inventory updates, and notifications. 

##### **● Mobile Platform Compatibility** 

The mobile application, used by both Faculty and Students, is developed using Android Studio, which limits compatibility to Android devices only. Support for other mobile operating systems, such as iOS, is beyond the scope of this study. 

##### **● Transaction Record Accuracy Dependency** 

The system relies on users to accurately and promptly update transaction records. Equipment availability displayed in the system may not always reflect the actual physical status of items in the laboratory if transactions are not logged on time. 

_STI College Cotabato_ 

8 

##### **REVIEW OF RELATED LITERATURE/STUDIES/SYSTEMS** 

##### **Local Related Studies** 

##### **Development and Evaluation of Online Facilities and Equipment Inventory and Borrowing System** 

Martos, Andres, and Ladera (2022) developed and evaluated an online facilities and equipment inventory and borrowing system for a senior high school in the Philippines, funded by DepEd Region IVA CALABARZON under its Basic Education Research Fund. The study was a direct response to DepEd Order No. 78, s. 2010, which encourages schools to integrate information and communications technology into their operations. The system automated the previously manual tracking and borrowing of laboratory equipment and facilities by replacing paper-based logbooks with a digital platform for recording, monitoring, and processing transactions. Evaluation results using a dependent t-test showed that the automated system significantly improved access time and user satisfaction compared to traditional manual logs. The study concluded that automation of inventory and borrowing processes reduces human error, improves record accuracy, and eases administrative workload. This study closely parallels the ECP system because both aim to automate equipment borrowing workflows in educational laboratory settings and address the inefficiencies of manual systems. 

##### **Online ICT Equipment Inventory and Borrowing System with Decision Support** 

Cepeda and Saludes (2025) conducted a study at St. Paul University Philippines that developed an Online ICT Equipment Inventory and Borrowing System with Decision Support to address the limitations of manual equipment management within the institution’s ICT department. The system integrated decision support features that enabled administrator/laboratory custodian to optimize inventory control through data-driven insights. It incorporated structured borrowing workflows, transaction logging, and role-based access control, allowing the system to serve multiple stakeholders with distinct responsibilities. The study demonstrated that structured 

9 

digital borrowing systems not only improve operational efficiency but also strengthen accountability and decision-making in laboratory environments. Findings further emphasized that role-differentiated access and detailed transaction histories are essential components of effective equipment management in academic institutions. This study is significant to ECP because it provides a direct precedent for integrating inventory management, borrowing workflows, and role-based access control into a unified platform, which reflects the same foundational approach used in the design of the ECP system. 

##### **Foreign Related Studies** 

##### **Laboratory Equipment Tracking and Reservation Systems in Academic Institutions** 

Several foreign studies on laboratory equipment tracking and reservation systems have emphasized the importance of automation in improving laboratory operations and resource accountability. Among these, Saini and Sharma (2022) developed a web-based laboratory resource management system for an engineering college in India that automated equipment reservation, borrowing, and return processes. The system incorporated user authentication, real-time availability tracking, transaction history, and administrator/laboratory custodian dashboards, significantly reducing manual workload and improving equipment accountability. Their findings showed that digital laboratory management systems reduce delays in processing transactions, improve monitoring accuracy, and support real-time tracking of laboratory assets. The study also emphasized that role-differentiated access and structured reservation workflows are essential for minimizing equipment misuse and maintaining accurate inventory records. These findings align with the core design of the ECP system and reinforce the effectiveness of digital inventory and borrowing solutions in educational laboratory environments. 

_STI College Cotabato_ 

10 

##### **SYNTHESIS** 

The reviewed literature and studies collectively highlight a common problem in educational institutions: the continued reliance on manual processes for managing laboratory equipment and inventory leads to inefficiency, inaccurate records, delayed transactions, and poor accountability. Both local and foreign sources confirm that transitioning to digital or web-based systems results in significant improvements in accuracy, monitoring, accessibility, and overall resource management. 

On the local side, Ahmad (2023) demonstrated that electronic asset inventory systems in Philippine schools significantly improved reliability, transparency, and efficiency in tracking school property. Similarly, Martos et al. (2022) showed that automating equipment borrowing workflows in a Philippine high school minimized human error, improved record accuracy, and enhanced user satisfaction compared to traditional paper-based methods. In addition, Cepeda and Saludes (2025) emphasized the value of integrating role-based access control, borrowing workflows, and transaction history features into a unified inventory management platform to strengthen accountability and support informed decision-making. 

From the foreign literature, Adekunle et al. (2024) confirmed that web-based laboratory management systems are effective in enabling centralized monitoring of borrowed equipment, while reducing administrative workload and improving operational efficiency. Similarly, Saini and Sharma (2022) demonstrated that web-based laboratory resource management systems in engineering institutions significantly improve equipment accountability through structured reservation workflows, role-based access controls, and availability tracking. These studies collectively support the idea that digital inventory platforms enable faster transaction processing, more organized record management, and better resource monitoring in academic institutions. 

Taken together, these studies validate the need for the ECP system and support its core design decisions. The recurring themes identified across the reviewed literature including automation of borrowing processes, updated inventory status, role-based access control, transaction monitoring, and digital record management, directly align with the features implemented in ECP. This body 

_STI College Cotabato_ 

11 

of literature confirms that the proposed system is grounded in established research and addresses a genuine and documented need within STI College Cotabato’s Engineering Laboratory. 

_STI College Cotabato_ 

12 

###### FEATURE-DRIVEN DEVELOPMENT 



<!-- Start of picture text -->
= = — aan </><br>2 || (2 |e eS l6 ie<br>Saal) [I Ero Ry<br>DEVELOP BUILD PLAN DESIGN BUILD<br>OVERALL MODEL FEATURE LIST BY FEATURE BY FEATURE BY FEATURE<br><!-- End of picture text -->

push notification delivery — each of which can be independently designed, built, and validated before being integrated into the complete platform. 

The FDD model consists of the following steps: 

##### **1. Develop an Overall Model** 

The researchers identified the current laboratory workflow, existing problems, and overall system structure through interviews and requirements gathering. 

##### **2. Build a Features List** 

The researchers identified the major system features, including inventory management, borrowing requests, approval workflows, notifications, and damage monitoring, and the mobile application. The Features List described in this step was constructed through a data-driven approach, using findings from stakeholder interviews as detailed below. 

##### **3. Plan by Feature** 

The identified features were organized according to development priority and implementation schedule. 

##### **4. Design by Feature** 

The researchers designed the database structure, system architecture, user interface, and workflows for each module. 

##### **5. Build by Feature** 

Each feature was developed, tested, refined, and integrated into the complete system incrementally until the final system was completed. 

_STI College Cotabato_ 

14 

NEXT. 



## wy supabase 



<!-- Start of picture text -->
Cue) Cloudinary Cloudinary<br><!-- End of picture text -->

# Cue) Cloudinary Cloudinary 

Visual Studio Code 





<!-- Start of picture text -->
fr ,<br>ede<br><!-- End of picture text -->

fr , ede 

##### **CALENDAR OF ACTIVITIES** 

The development of **ECP: A Web-App Engineering Laboratory Management System for STI College Cotabato** followed a systematic schedule that guided the researchers from the planning stage to the completion of the project. 

In **January 2026** , the researchers started the project by selecting the members, announcing the official groups, choosing the project adviser, and brainstorming possible capstone titles. These activities helped the researchers prepare for the development of the proposed system and establish the direction of the study. 

In **February 2026** , the researchers finalized the proposed project title and continued regular consultations with the project adviser. During this month, they started writing the initial chapters of the documentation and planned the design and development of the web application. 

In **March 2026** , the researchers began developing the core modules of the system, including the login page, dashboard, and inventory management features. Adviser consultations were conducted regularly to review the progress of both the documentation and the system development. The researchers also continued improving the user interface and implementing the initial system functions. 

In **April 2026** , the researchers developed additional features such as the equipment request and approval process, borrowing and returning transactions, and user management. They also prepared for the pre-final defense and implemented the recommendations provided by the panel members after the presentation. Continuous testing and debugging were performed to improve the system's functionality and usability. 

In **May 2026** , the researchers focused on completing the remaining system features, including damage reporting, notifications, report generation, and inventory monitoring. System testing and debugging were conducted to ensure that all modules functioned correctly. The researchers also finalized the documentation, presented the project during the final defense, and immediately 

_STI College Cotabato_ 

20 

started implementing the revisions recommended by the panel members. These improvements were recorded during the weekly adviser consultations. 

In **June 2026** , the researchers completed the final revisions by implementing the comments and recommendations given by the panel during the final defense. An adviser consultation was conducted to verify that all required revisions had been completed. After the revisions were approved, the researchers began planning future improvements for the system, including the integration of equipment images and additional features that could further improve the Engineering Laboratory Management System. These activities marked the completion of the project and prepared the system for final submission. 

_STI College Cotabato_ 

21 



<!-- Start of picture text -->
Selection of<br>members<br><!-- End of picture text -->

|Selection of<br>Adviser|Selection of<br>members<br>Announcement<br>ofOfficial<br>Groups<br>BrainstormingofProposedCapstoneTitles|
|---|---|





<!-- Start of picture text -->
Announcement<br>of Official<br>Groups<br><!-- End of picture text -->



<!-- Start of picture text -->
Selection of<br>Adviser<br><!-- End of picture text -->



<!-- Start of picture text -->
Selection of<br>Adviser Brainstorming of Proposed Capstone Titles<br><!-- End of picture text -->



<!-- Start of picture text -->
Meeting<br>with<br>Adviser<br><!-- End of picture text -->



<!-- Start of picture text -->
Finalization of 3 Titles<br><!-- End of picture text -->



<!-- Start of picture text -->
Brainstorming of Proposed<br>Capstone Titles<br><!-- End of picture text -->

|Brainstorming of Proposed<br>Capstone Titles|Meeting<br>with<br>Adviser|Fi|nalization of3 Titles|
|---|---|---|---|
|Meeting<br>with<br>Adviser||Title<br>Proposal<br>Initia|Verdict<br>l System Development|
|7<br>Inihal System Deve<br>Documentation For Chapter<br>|<br>ModuleDevelopment|lopment||Adviser<br>Consultation|





<!-- Start of picture text -->
Initial System Development<br><!-- End of picture text -->



<!-- Start of picture text -->
Documentation For Chapter |<br>Module Development<br><!-- End of picture text -->



<!-- Start of picture text -->
Documentation for Chapter |<br>Module Development<br><!-- End of picture text -->



<!-- Start of picture text -->
Adviser<br>Consultation<br><!-- End of picture text -->



<!-- Start of picture text -->
Documentation for Chapter 2<br>Borrowing; Module Development<br><!-- End of picture text -->



<!-- Start of picture text -->
Documentation for Chapter 2<br>Borrowing Module Development<br><!-- End of picture text -->



<!-- Start of picture text -->
Preparation.. for Pre-Final;; Defense<br><!-- End of picture text -->



<!-- Start of picture text -->
. Pre-Final Revisions<br>Meetingwith; Preparation.. for Pre-Final;; Defense Pre-Finalre-Fina— \ mplimplementPp t i ne ngE thetl<br>a Defense panel's comments)<br>Adviser<br><!-- End of picture text -->



<!-- Start of picture text -->
Pre-Final Revisions (implementing the panel's comments) yo<br><!-- End of picture text -->



<!-- Start of picture text -->
Pre-Final Revisions<br>(implementing the<br>panel's comments)<br>. Adviser<br>Pre-Final , a<br>Revisions Consultation<br>oe (checking of System Testing and Debugging<br>(implementing<br>the panel's the completed<br>e PARES revisions) Finalization of Documents<br>comments} ;<br>And Meeting<br>System Testing and Debugging<br>Finalization of Documents<br>System Testing and Debugging<br>Finalization of Documents<br>Adviser ; Final Revisions<br>Consultation‘anon ltat]; PreparationDef for Final DefenseFinal (implementing the<br>And Meeting efense : panel's' comments)<br>Final Revisions<br>(implementing the<br>panel's<br>comments}<br><!-- End of picture text -->

|.<br>FinalRevisions(implementingthe panel'scomments)|
|---|
|Adviser<br>Consultation<br>(checking of<br>the completed<br>revisions}<br><br>|
|7<br>PlanningEquipmentImageIntegrationandAdditionalFeatures|







<!-- Start of picture text -->
Planning Equipment Image Integration and Additional Features<br><!-- End of picture text -->

##### **Calendar of Activities for the Development of the ECP System (Capstone 2)** 

##### **JULY 2026** 

|**Sunday**|**Monday**|**Tuesday**|**Wednesday**|**Thursday**|**Friday**|**Saturday**|
|---|---|---|---|---|---|---|
|1|2|3|4|5|6|7|
|8|9|10|11|12|13|14|
|15|16|17|18|19|20|21|
|22|23|24|25|26|27|28|
|29|30|31|||||



##### **AUGUST 2026** 

|**Sunday**|**Monday**|**Tuesday**|**Wednesday**|**Thursday**|**Friday**|**Saturday**|
|---|---|---|---|---|---|---|
|1|2|3|4|5|6|7|
|8|9|10|11|12|13|14|
|15|16|17|18|19|20|21|
|22|23|24|25|26|27|28|
|29|30|31|||||



_STI College Cotabato_ 

27 

##### **Resources** 

##### **Hardware** 

##### **PC:** 

- AMD Ryzen 5 2600 Processor 

- 16 GB RAM 

- 512 GB HDD Storage 

- NVIDIA GeForce GTX 1650 

- Windows 10 (64-bit) 

##### **Laptop:** 

- ASUS Vivobook 16 (V3607VH) 

- Intel® Core™ 5 210H Processor (2.20 GHz) 

- 16 GB RAM 

- 477 GB SSD Storage 

- NVIDIA GeForce RTX 5050 Laptop GPU (8 GB) 

##### **Phone:** 

- Infinix HOT 60 Pro 

- MediaTek Helio G200 (6 nm) 

- 256 GB Storage 

- 8 GB Ram 

- Octa-core (2×2.2 GHz Cortex-A76 & 6×2.0 GHz Cortex-A55) 

##### **Software** 

- Windows 11 (64-bit) 

- Android Studio 

- Visual Studio Code 

- Next.js 

- Supabase (PostgreSQL) 

- Cloudinary 

- Node.js 

- Google Chrome 

- Microsoft Office (Word and PowerPoint) 

_STI College Cotabato_ 

28 

##### **REQUIREMENTS ANALYSIS** 

##### **Interview-Based Problem Identification and System Mapping** 

The requirements of the ECP system were identified through interviews with the three primary user groups of the Engineering Laboratory of STI College Cotabato: The Administrator/Laboratory Custodian, Designated Faculty, and Students. The responses revealed several recurring issues and gaps in the current laboratory process. These findings served as the primary basis for designing the proposed system’s features. A detailed mapping of interview findings to system features is presented in Table 1. 

|**Interview Findings **|**Identified Problem**|**Proposed System Feature**|
|---|---|---|
|Students and faculty are not aware<br>of how to check equipment<br>availability.<br>_(Interview Transcript 1, 07:40;_<br>_Interview Transcript 2, 06:33)_|Lack of visibility of<br>available equipment.|Inventory availability display<br>showing equipment availability and<br>status.|
|The borrowing process is unclear<br>or not commonly practiced.<br>_(Interview Transcript 2, 00:54;_<br>_Interview Transcript 3, 01:36)_|Undefined and inconsistent<br>borrowing workflow.|Structured borrowing and returning<br>workflow with guided steps.|
|No clear way to track who<br>borrowed equipment.<br>_(Interview Transcript 2, 06:33;_<br>_Interview Transcript 4, 05:15)_|Lack of tracking and<br>accountability.|Records borrower identity,<br>timestamps, and transaction details.|
|Possible issues with responsibility<br>for damaged or lost equipment.<br>_(Interview Transcript 1, 05:57;_<br>_Interview Transcript 4, 07:52)_|No accountability<br>mechanism.|Links equipment condition and<br>damage reports to specific users and<br>transactions.|
|Students experience confusion<br>and delays during lab activities.<br>_(Interview Transcript 4, 02:49)_|Inefficient and manual<br>processes.|Automated request and approval<br>system.|
|No notification or reminder<br>system.|Lack of communication and|Push notifications for confirmations|
|_(Interview Transcript 3, 21:58;_<br>_Interview Transcript 4, 18:07)_|follow-ups.|and reminders.|
|Faculty expect involvement in<br>approval and monitoring.|No defined user roles.|Role-based access control (Admin,<br>Faculty,Student).|



_STI College Cotabato_ 

29 

|**Interview Findings **|**Identified Problem**|**Proposed System Feature**|
|---|---|---|
|_(Interview Transcript 2, 03:46;_<br>_Interview Transcript 4, 21:50)_|||
|Difficulty handling multiple<br>borrowing requests.|No conflict management|Availability checking and request|
|_(Interview Transcript 3, 10:36;_|system.|validation.|
|_Interview Transcript 4, 02:49)_|||
|Students should only access<br>equipment relevant to their<br>enrolled subject/course.|No subject-based restriction<br>equipment visibility.|Subject-based equipment filtering,<br>using enrollment data from account<br>creation to show students only|
|_(Interview Transcript 4, 25:04)_||equipment tied to their subjects.|



_Table 1. Mapping of Interview Findings to Proposed System Features_ 

As shown in Table 1, each identified problem from the interviews is directly addressed by a corresponding system feature, ensuring that the proposed system is grounded in actual user needs. 

While interview respondents expressed a preference for SMS notifications due to their reliability without an internet connection (Interview Transcript 1, 17:19; Interview Transcript 2, 14:05; Interview Transcript 3, 23:35), the ECP system implements push and in-app notifications instead. This decision was made because SMS delivery typically requires a paid third-party SMS gateway and incurs a per-message cost, which is not sustainable for a student-scale deployment with frequent borrowing and return transactions. Push and in-app notifications provide immediate, real-time delivery at no additional cost and are consistent with the system's existing reliance on internet connectivity for its web and mobile platforms, as noted in the system's Limitations. 

A separate concern raised during the interviews was that only faculty should be authorized to submit borrowing requests on behalf of students, since the system cannot physically verify equipment condition upon return (Interview Transcript 3, 06:27). The ECP system retains the safeguards this concern was meant to address while still allowing students to submit requests directly. Every student borrowing request still requires approval from the Administrator/Laboratory Custodian or Designated Faculty before it is granted, and equipment condition at return is still physically assessed and recorded by the Administrator/Laboratory Custodian or Designated Faculty, not by the student or the system alone. This preserves human 

_STI College Cotabato_ 

30 

oversight and physical verification at both the approval and return stages, while giving students the added convenience of submitting requests directly rather than routing every transaction through a faculty intermediary. 

##### **Data-Driven System Design** 

The design of the ECP system follows a data-driven approach: problems were identified through direct interviews with stakeholders, validated through field observation, and translated into specific system features. This ensures that each feature system directly responds to real user needs rather than assumptions. 

The primary users of the system are as follows: 

##### **Administrator/Laboratory Custodian** 

The Administrator/Laboratory Custodian manages equipment records, inventory monitoring, transaction records, and overall laboratory operations. The Administrator/Laboratory Custodian primarily reviews and approves student borrowing requests. If unavailable, the Designated Faculty may review and approve borrowing requests related to assigned laboratory courses or subject areas. Faculty borrowing transactions for instructional or laboratory purposes do not require approval; however, these transactions are still recorded and monitored by the system for accountability and inventory tracking. 

##### **Designated Faculty** 

Faculty may perform direct borrowing transactions for instructional or laboratory purposes without requiring approval. However, all Designated Faculty borrowing activities are recorded in the system logs and reports for monitoring, accountability, and inventory tracking purposes. 

##### **Students** 

Access the system through the Android mobile application. Students browse available equipment, submit borrowing requests, track their requests status, and receive push notifications for approvals, rejections, and return reminders. 

_STI College Cotabato_ 

31 

##### **REQUIREMENTS DOCUMENTATION** 

##### **Functional Requirements** 

##### ● **Equipment and Inventory Management** 

The Administrator/Laboratory Custodian can add, update, and delete equipment records, including equipment name, category, serial number, quantity, condition, and location. The system supports equipment categorization and displays updated equipment availability status for each item in the inventory. Equipment records are tagged with their associated subject or course area. Students can only view and request equipment tied to the subjects they are currently enrolled in, based on enrollment data provided during account creation. 

##### ● **Borrowing and Returning Module** 

Students submit borrowing requests through the mobile application by selecting equipment and specifying the purpose and expected return date. The system shall allow the Administrator/Laboratory Custodian to review and approve student borrowing requests. In cases where the Administrator/Laboratory Custodian is unavailable, the Designated Faculty may review and approve borrowing requests related to assigned laboratory courses or subject areas. Upon return, the equipment Administrator/Laboratory Custodian or Designated Faculty, assess and records the equipment condition, and the inventory is updated accordingly. 

##### **● Notification System** 

The system provides in-app and push notifications to inform students of borrowing request approvals, rejections, and return confirmations. Automatic alerts are also generated for equipment that has not been returned within the specified return period. 

##### ● **Equipment Condition Monitoring** 

Equipment condition is assessed and recorded during return transactions and it is classified as Good, Damaged, or Needs Replacement. Damage reports are automatically linked to the corresponding borrowing transaction and  the responsible borrower. 

_STI College Cotabato_ 

32 

##### ● **User and Access Management** 

The system supports three user roles: Administrator/Laboratory Custodian, Designated Faculty, and Student. The Administrator/Laboratory Custodian manages equipment records and user accounts, including batch upload of student information (e.g., via CSV/spreadsheet import) to create multiple student accounts at once, along with their enrolled subject or course, which determines the equipment visible to each student. Designated Faculty may review and approve borrowing requests related to assigned laboratory courses or subject areas when the Administrator/Laboratory Custodian is unavailable and monitors transactions. Students submit and track borrowing requests through the mobile application. 

##### ● **Administrative/Laboratory Custodian Dashboard** 

The Administrator/Laboratory Custodian has access to a centralized dashboard that displays equipment availability, active transactions, overdue items, and the overall inventory status. The system generates exportable reports for borrowing activities and equipment condition records. 

##### ● **Announcement Management** 

The Laboratory Custodian can create, edit, and publish announcements. Published announcements are automatically displayed on the Faculty web dashboard and the Student mobile application dashboard. 

##### **Non-Functional Requirements** 

##### ● **Usability** 

The system is designed with a simple and intuitive interface to accommodate users with varying levels of technical proficiency. The web application provides a clean layout for Administrator/Laboratory Custodian and Designated Faculty. In contrast the mobile application offers straightforward navigation for Students to browse equipment and submit borrowing requests in a few steps. 

_STI College Cotabato_ 

33 

##### ● **Accessibility** 

The web application is accessible through modern browsers such as Google Chrome, Mozilla Firefox, and Microsoft Edge without requiring additional software installation. The mobile application is available for Android devices, allowing Faculty and Students to access the system from anywhere with an internet connection. 

##### ● **Reliability** 

The system is designed to ensure consistent availability during laboratory operations with minimal downtime. Transaction records, borrowing requests, and inventory updates are processed and recorded promptly to prevent data loss during active laboratory sessions. 

##### ● **Security** 

The system implements secure login authentication and role-based access control to protect user accounts and restrict unauthorized access to system functionalities. Each user role, namely Administrator/Laboratory Custodian, Designated Faculty, and Student, can only access the features and data assigned to their respective role. 

##### **● Performance** 

The system is designed to handle multiple concurrent borrowing requests without delays in processing or notification delivery. Push notifications for approvals, rejections, and return reminders must be delivered promptly to ensure timely communication between users 

##### **● Compatibility** 

The web application is compatible with major modern browsers on both desktop and mobile devices. The Faculty- and student-facing mobile application is developed using Android Studio and is compatible only with Android devices running supported operating system versions. 

_STI College Cotabato_ 

34 

##### **DESIGN OF SOFTWARE, SYSTEM, PRODUCT, and/or PROCESSES** 

The ECP system follows a three-tier web application architecture consisting of the Presentation Layer, Application Layer, and Data Layer. This architecture separates user interaction, system logic, and data storage into distinct layers, ensuring a structured, maintainable, and scalable platform for managing laboratory equipment at STI College Cotabato. 

##### **System Flowchart** 

The following flowchart shows the step-by-step process of how the ECP system works for all three user roles: 

##### **Step 1** — **User Login & Role Identification** 

Users (Administrator/Laboratory Custodian, Designated Faculty, or Student) log in to the system. The system identifies the user role and redirects them to their respective dashboard (Web or Mobile). 

##### **Step 2** — **Admin Inventory Management (Web Application)** 

The Administrator manages the equipment inventory by adding, updating, or deleting records such as item name, description, quantity, condition, and availability. 

##### **Step 3** — **View Available Equipment** 

Designated Faculty (Web or Mobile App) and Students (Mobile App) can view available laboratory equipment in the system. 

##### **Step 4** — **Borrowing Request Submission (Students – Mobile App)** 

Students select equipment and submit a borrowing request through the mobile application, including purpose and expected return date. 

##### **Step 5** — **Availability Check** 

The system checks the inventory database to determine equipment availability. 

_STI College Cotabato_ 

35 

##### **Step 6** — **Borrowing Request Review and Approval (Web Application)** 

The Administrator/Laboratory Custodian primarily reviews the borrowing request. If 

unavailable, the Designated Faculty may review and approve requests related to assigned laboratory courses or subject areas. 

##### **Step 7** — **Borrowing Transaction & Push Notification** 

Once approved, the system records the borrowing transaction and automatically sends a push notification to the student confirming approval. 

##### **Step 8** — **Return of Equipment** 

The borrower returns the equipment, and the system records the return transaction. 

##### **Step 9** — **Condition Assessment** 

The condition of the returned equipment is assessed and classified as Good, Damaged, or Needs Replacement. 

##### **Step 10** — **Inventory Update & Damage Reporting** 

If the item is in good condition, the inventory is updated as available. If the item is damaged, a damage report is recorded and linked to the transaction. 

##### **Step 11** — **In-App Notification** 

The system sends an in-app or push notification confirming that the return has been successfully 

processed **.** 

_STI College Cotabato_ 

36 



<!-- Start of picture text -->
Step 1: User Login & Role<br>Identification<br>Admin/Faculty/Student<br>< Identify Role ><br>Admin/Lab Custodian<br>Step 2: Inventory<br>Management<br>Add/Update/Delete<br>equipment<br>Student Faculty<br>Inventory Database<br>Updated<br>Step 3: View Available Step 3: View Available<br>Equipment Equipment<br>Mobile App Web Application<br>Step 4: Submit Borrowing<br>Request<br>Student selects<br>equipment, purpose,<br>return date<br>Step 5: Availability Check<br>System checks inventory<br>database<br>Not Available Available<br>Step 6: Request Review &<br>Notify5  Student:. Equipment7 arin’ApprovalTait Gereciant<br>Unavailable primary*<br>Designated Faculty backup<br>Approve<br>Step 7: Borrowing<br>Transaction Recorded<br>Push Notification sent to<br>Student<br>Step 8: Return Equipment<br>System records return<br>transaction<br>Step 9: Condition<br>Assessment<br>Good, Damaged, or Needs<br>Replacement<br>Damaged/Needs ol<br>Replacement<br>StepLinked7 10:oseDamageto transactionReport. Step Mark10: Updateas AvailableInventory<br>Step 11: In-App/Push<br>Notification<br>Return successfully<br>processed<br>End<br><!-- End of picture text -->

##### _Figure 10. ECP System Flowchart_ 

This flowchart presents the operational workflow of the Laboratory Equipment Borrowing and Inventory Management System. The process begins with user login and role identification, where users are categorized as Administrator/Lab Custodian, Designated Faculty, or Student. Administrator/Lab Custodian manage equipment inventory by adding, updating, or deleting records, while faculty and students can browse available equipment through the web or mobile application. 

Students submit borrowing requests by selecting equipment, purpose, and return date. The system then performs an availability check using the inventory database. If the equipment is unavailable, the request cannot proceed; otherwise, it is forwarded for review and approval by the Administrator/Lab Custodian or designated faculty member. Once approved, the borrowing transaction is recorded and a push notification is sent to the student. 

After use, the student returns the equipment, and the system records the return transaction. A condition assessment is then conducted to evaluate whether the equipment is good, damaged, or needs replacement. If the item is in good condition, the inventory is updated and marked as available again. If damaged, a damage report is created and linked to the transaction. Finally, the system sends an in-app or push notification confirming that the return process has been completed successfully. 

_STI College Cotabato_ 

38 

##### **System Architecture Diagram** 

The following diagram shows the overall architecture of the ECP system: 

##### **Users** 

The system is accessed by three primary user roles: Administrator/Laboratory Custodian, Designated Faculty, and Students. The Administrator/Laboratory Custodian manages inventory, users, and generates reports. The Administrator/Laboratory Custodian primarily approves or rejects borrowing requests, while the Designated Faculty may assist in reviewing and approving requests and monitoring assigned laboratory courses when necessary. Students view equipment, submit borrowing requests, track request status, and receive notifications. 

##### **Client Applications** 

Users interact with the system through two client platforms communicating via HTTPS. The Web Application is used by Administrator/Laboratory Custodian and Designated Faculty for management and approval tasks. The Mobile Application is used by Designated Faculty to review and approve borrowing requests and monitor equipment on the go, and by Students to browse equipment, submit borrowing requests, and receive notifications. 

##### **Application Layer (Web Server)** 

This is the core back-end layer that processes all system logic. It consists of: 

- **Authentication & Authorization —** Handles login, role identification, and role-based access control. 

- **Inventory Management —** Manages equipment records and inventory data. 

- **Approval Management** — Processes borrowing request approvals and rejections. 

_STI College Cotabato_ 

39 

- **User Management** — Handles user accounts, role assignments, and batch upload of student information including subject/course enrollment, which is used to filter equipment visibility for students. 

- **Condition Assessment —** Records and updates equipment condition after each return. 

- **Borrowing Management** — Manages the borrowing request and transaction process. 

- **Damage Reporting** — Records damage reports and links them to specific transactions. 

- **Return Management** — Processes equipment return transactions. 

- **Notification Service** — Manages and triggers push and in-app notifications for borrowing and return events. 

- **Reporting & Dashboard** — Provides analytics, reports, overdue item tracking, and inventory status monitoring. 

- **Announcement Management —** Handles creation, publishing, and display of announcements to Faculty and Student dashboards. 

##### **Data Layer** 

Implemented using Supabase (PostgreSQL), it stores all main data entities, including Users, Roles, Equipment, Categories, Inventory, Borrowing Requests, Approvals, Borrowing Transactions, Return Transactions, Condition Records, Damage Reports, and Notification Logs. 

##### **External Services** 

The system integrates a third-party push notification service to deliver push notifications for borrowing approvals, rejections, return reminders, and transaction updates. 

##### **System Features (Core Modules Flow)** 

_STI College Cotabato_ 

40 

The end-to-end workflow of the system follows this sequence: 

1. **Inventory Management** — Admin adds, updates, or deletes equipment and manages inventory. 

2. **View Available Equipment** — Designated Faculty and Students view available laboratory equipment. 

3. **Borrowing Request (Students)** — Students submit borrowing requests with purpose and expected return date. 

4. **Approval (Administrator/Laboratory Custodian or Designated Faculty)** — The Administrator/Laboratory Custodian primarily reviews and approves borrowing requests, while the Designated Faculty may assist when necessary. 

5. **Push Notification** — The system sends push notifications for approval or rejection. 

6. **Return Equipment** — Borrower returns equipment, and the transaction is recorded. 

7. **Condition Assessment** — Equipment condition is assessed as Good, Damaged, or Needs Replacement. 

8. **Inventory Update & Damage Reporting** — Inventory is updated or a damage report is recorded and linked to the transaction. 

9. **In-App Notification** — The system sends a confirmation of a successful return. 

_STI College Cotabato_ 

41 



<!-- Start of picture text -->
‘2 USERS<br>Student Designated Faculty LaboratoryQo BERSCustodian U<br>BF CLIN aPecicarions Na<br>Web Application<br>Mobile Application Administrator / Laboratory<br>Student Custodian & Designated<br>i & APPLICATION LAYER Nd<br>i (Web Server)<br>iii Returnurn MaiManagementit Beorrowinging Mai Managementit Authenticationaren&<br>i Notification Service Condition Assessment Approval Management. Inventory Management<br>Firebase Cloud Messaging<br>(FCM) Reporting & Dashboard Damage Reporting User Management<br>Push Notifications<br>MySQL Database<br>Users, Roles, Equipment,<br>Categories,<br>Inventory, Requests,<br>Approvals,<br>Transactions, Conditions,<br>Damage Reports,<br>Notification Logs<br><!-- End of picture text -->

This diagram illustrates the high-level architecture of a Laboratory Equipment Borrowing and Inventory Management System. The system supports three main user roles: Students, Designated Faculty, and Administrators/Laboratory Custodians. Users interact with the platform through a mobile application for students and a web application for designated faculty and administrator/laboratory custodian, both secured via HTTPS. 

The application layer contains core modules such as Borrowing Management, Return Management, Approval Management, Inventory Management, Authentication & Authorization, Notification Service, Condition Assessment, Damage Reporting, User Management, and Reporting & Dashboard. These modules coordinate the processes of requesting, approving, borrowing, returning, and monitoring laboratory equipment. 

An external push notification service is integrated to provide real-time push notifications. All system components connect to a centralized Supabase (PostgreSQL) database, which stores data related to users, equipment, inventory, approvals, transactions, damage reports, and notification logs. The architecture follows a layered design to ensure secure communication, organized workflows, and efficient data management. 

43 

##### **REFERENCES** 

- Adekunle, T. A., Abolore, A. A., Mutiu, A. A., & Olalekan, A. O. (2024). _Design and implementation of a web-based laboratory management system for efficient resource tracking_ . International Journal of Scientific Research in Computer Science, Engineering and Information Technology, 10(2), 234–242. 

- Ahmad, A. C. (2023). _e-AIMSS: Electronic asset inventory and management system in school for resource optimization and organizational productivity_ . International Journal of Research Publications, 122(1), 45–58. 

- Cepeda, J. A. U., & Saludes, A. J. C. (2025). _Online ICT equipment inventory and borrowing system with decision support_ . European Journal of Innovative Studies and Sustainability, 1(5), 62–70. https://doi.org/10.59324/ejiss.2025.1(5).07 

- Martos, A. J. C., Andres, J. R. B., & Ladera, R. R. (2022). _Development and evaluation of online facilities and equipment inventory and borrowing system_ . International Journal of Advanced Research in Computer Science, 13(3), 28–35. 

- Fitzgibbons, L. (2024). _Feature-driven development (FDD)_ . TechTarget. <u>https://www.techtarget.com/searchsoftwarequality/definition/feature-driven-development</u> 

- Saini, R., & Sharma, P. (2022). _Web-based laboratory resource management system for engineering institutions_ . International Journal of Computer Applications, 184(15), 1–7. 

_STI College Cotabato_ 

44 

##### **APPENDICES** 

_STI College Cotabato_ 

45 

##### **APPENDIX A. RESOURCE PERSONS** 

_STI College Cotabato_ 

46 

##### **RESOURCE PERSON** 

This section lists the individuals who provided expert insights, feedback, or validation during the development of the ECP: A Web-App Engineering Laboratory Management System for STI College Cotabato. 

##### **Ms. Almirah E. Abang** 

Capstone Project Adviser, STI College Cotabato 

Supervised the development of the manuscript and system design 

##### **Engr. Roland Carl A. Denopol, PCpe** 

Capstone Project Coordinator, STI College Cotabato 

Engineering Faculty, STI College Cotabato 

Participated in interviews; provided detailed laboratory workflow and inventory challenges 

##### **Ma'am Maleja W. Macmod** 

Science Faculty, STI College Cotabato 

Participated in interviews; provided requirements for feedback mechanism and notifications 

##### **Ma'am Rayhanah M. Tiag** 

_STI College Cotabato_ 

47 

Science Faculty, STI College Cotabato 

Participated in interviews; provided insights on equipment tracking and accountability 

##### **Sir Abdulnaem Balabagan** 

Science Faculty, STI College Cotabato 

Participated in interviews; emphasized approval workflow and notifications 

_STI College Cotabato_ 

48 

##### **Interview Transcripts** 

The following transcripts are verbatim records of interviews conducted with faculty members of STI College Cotabato as part of the requirements-gathering phase for the ECP: A Web-App Engineering Laboratory Management System. Interviews were conducted to identify current challenges in laboratory equipment management, understand faculty expectations, and gather functional requirements for the proposed system. 

##### **Interview Transcript 1** 

**Interviewer:** Bin Fhaeid B Mambao (Bien) 

**Respondent:** Ma'am Maleja W. Macmod — Science Faculty, STI College Cotabato 

**Context:** Semi-structured interview on laboratory equipment borrowing practices, faculty roles, and system requirements. 

##### **Transcript:** 

**Bin (00:04):** Good afternoon, Ma'am. My name is Benifide Mambo. The purpose 

of this interview is to gather insights about the laboratory process, identify possible issues in equipment management, and understand faculty expectations for our proposed system. 

**Bin (00:31):** My first question is: Are you familiar with how laboratory equipment borrowing is supposed to work in your institution? 

**Ma'am Maleja W. Macmod (00:39):** To be honest, I am not quite familiar with each and every step. But what I know is that we — as faculty — are assigned to 

_STI College Cotabato_ 

49 

navigate or make checks within the laboratory apparatus. There are only three of us science teachers here, so each one of us was assigned to check the inventory of each apparatus in the laboratory. We communicate with one another to inform each other whenever an apparatus is borrowed from the laboratory. 

**Bin (01:27):** Since borrowing is not commonly practiced yet in the laboratory, how do you usually handle equipment needs during your classes or laboratory activities? 

**Ma'am Maleja W. Macmod (01:37):** During our inventory with Sir Val, we checked if the needed apparatus were available. Some were not available, so we sought approval and supervision from the admin to order those apparatus online. That is how we handled the need for apparatus. 

**Bin (02:25):** If a proper borrowing system were implemented, how do you think the process should work from request to return? 

**Ma'am Maleja W. Macmod (02:35):** First, we should list down all the apparatus — different kinds of glassware, test tubes, everything in the laboratory — and place them in the system. Then we indicate how many pieces are available. Upon request, it should state who is borrowing, when for what purpose, and which activity requires the apparatus. After that, the return date should be specified. For the return process, it should again capture the borrower's name, the date borrowed, the date returned, and the purpose. There should also be a feedback mechanism where the borrower can indicate the condition of the apparatus — whether it was okay, whether it was used properly. Feedback is very important because it allows the system to improve over time. 

_STI College Cotabato_ 

50 

**Bin (04:43):** What role do you think faculty members should have in the borrowing process? 

**Ma'am Maleja W. Macmod (04:50):** Faculty should monitor and supervise the student who borrowed the apparatus, ensuring it is returned properly and in good condition. Since we are the ones assigned to conduct laboratory inventory, we need to supervise returns. If there is damage, the student should receive a warning, and that should be reflected in the system for future borrowing requests. 

**Bin (05:53):** What are the possible problems and challenges with the proposed system? 

**Ma'am Maleja W. Macmod (05:57):** Students are naturally clumsy, so we cannot give a 100% assurance that the apparatus will be returned in perfect condition. There is always a risk of breakage or damage. Another concern is the system's reliability — if it is not properly structured, requests and returns may not process correctly. There is also the issue of power dependency: if there is a brownout, what happens to the system? These are the challenges that need to be addressed. 

**Bin (07:26):** Do you think there will be issues with equipment availability, item tracking, and student responsibility for damaged equipment? 

**Ma'am Maleja W. Macmod (07:40):** Yes. Equipment availability will be a problem if a specific apparatus is unavailable. The system should indicate what alternatives are available. For tracking, SMS updates are a good approach because they directly inform the borrower. As for responsibility, students need to understand that they are accountable for what they borrow. If something is 

_STI College Cotabato_ 

51 

damaged, the system should immediately notify both the student and the faculty in charge, and the damage should be recorded and linked to the specific borrower. 

**Bin (08:22):** How should damage or faulty equipment be reported and managed? 

**Ma'am Maleja W. Macmod (15:26):** The student should be notified first. Then the information is passed to the admin, specifying the quantity and extent of the damage. Students should understand that borrowed apparatus has a corresponding cost, and they are responsible for taking care of them. 

**Bin (16:10):** How do you think borrowing requests should be approved, and who should be responsible for releasing equipment? 

**Ma'am Maleja W. Macmod (16:21):** The system should send notifications both to the borrower and to the faculty in charge of the laboratory inventory. That way, the faculty is also aware of what was borrowed and when it is expected to be returned. This is especially helpful during inventory checks. 

**Bin (17:10):** How should faculty and students be informed about equipment availability, request approval, and return deadlines? 

**Ma'am Maleja W. Macmod (17:19):** SMS is the most convenient method. It is direct and does not require an internet connection. Emails can also be used since they provide a formal record, but SMS is more immediate for notifications. 

Bin (17:57): Do you think reminders for returning equipment are necessary? 

**Ma'am Maleja W. Macmod (18:04):** Yes, it is very necessary. Reminders should be sent both in morning and in the evening as the return deadline approaches. This ensures that the borrower is fully aware that the apparatus must be returned promptly. 

_STI College Cotabato_ 

52 

**Bin (19:00):** Do you think the system will be help laboratory equipment and borrowing? 

**Ma'am Maleja W. Macmod (19:14):** Yes, I really look forward to it. Right now, we use a manual Excel inventory, which requires physically checking availability. With this system, it will be much more convenient and efficient. The system can show what is available, what is damaged, and what still needs to be complied. 

**Bin (20:18):** Are there any additional features you would like to suggest? 

**Ma'am Maleja W. Macmod (20:29):** Real-time availability display and reports on equipment status — how many are available, how many are damaged, how many need replacement. A feedback system is also very important — whether through star ratings or written feedback — so the system can continuously improve. 

##### **Interview Transcript 2** 

**Interviewer:** Bin Fhaeid Mambao (Bin) 

**Respondent:** Ma'am Rayhanah M. Tiag — Science Faculty, STI College Cotabato 

**Context:** Semi-structured interview on laboratory borrowing expectations, equipment availability, and notification preferences 

##### **Transcript:** 

**Bin Fhaeid Mambao (00:01):** Good day, Ma'am. My name is Bin Faid Mambao. 

I am the interviewer for this session regarding our Engineering Laboratory Management System. The purpose of this interview is to understand faculty 

_STI College Cotabato_ 

53 

expectations for the system, gain insights about laboratory processes, identify possible issues in equipment management, and gather requirements for our proposed capstone project. 

**Bin Fhaeid Mambao (00:41):** My first question is: Are you familiar with how laboratory equipment borrowing is supposed to work in your institution? 

##### **Ma'am Rayhanah M. Tiag (00:43):** Yes. 

**Bin Fhaeid Mambao (00:45):** Can you describe the borrowing process for laboratory equipment? 

**Ma'am Rayhanah M. Tiag (00:54):** We do not usually borrow in a formal sense. If the equipment is available, we can use it at any time. But if a specific apparatus is not available, we request it from the admin and wait for it to be procured before it can be used again. 

**Bin Fhaeid Mambao (01:21):** Since borrowing is not commonly practiced in the laboratory, how do you usually handle equipment needs during your classes? 

**Ma'am Rayhanah M. Tiag (01:33):** We handle it directly — if the materials are there, we use them. Each laboratory already has its own set of materials, so we just take what we need as long as it is available. There is no formal process beyond that. 

**Bin Fhaeid Mambao (02:35):** If a borrowing system were implemented, how do you think the process should work from request to return? 

**Ma'am Rayhanah M. Tiag (02:50):** There should be a designated person — like a laboratory technician — who manages requests. The borrower would indicate what they need and how many, then sign or confirm the request. Upon return, 

_STI College Cotabato_ 

54 

items must be complete, and anything damaged must be replaced. That is the standard borrowing process in laboratories, which is not yet implemented here. 

**Bin Fhaeid Mambao (03:34):** What role do you think faculty members should have in the borrowing process? 

**Ma'am Rayhanah M. Tiag (03:46):** It should not be the responsibility of all faculty members to approve requests. There should be a single authorized person handling approvals. However, faculty members — especially science and engineering teachers — can take on a monitoring role, checking what is missing, what is available, and recommending what needs to be procured. 

**Bin Fhaeid Mambao (04:58):** What problems do you think might arise in the system when students borrow equipment? 

**Ma'am Rayhanah M. Tiag (05:34):** Without a system, students might assume they can use equipment anytime, leading to loss or damage of the apparatus. For example, if a microscope goes missing, it affects all subsequent laboratory activities that require it. With no tracking, it is impossible to determine who used or damaged an item. 

**Bin Fhaeid Mambao (06:18):** Do you think there could be issues with equipment availability, tracking of borrowed items, and responsibility for damages? 

**Ma'am Rayhanah M. Tiag (06:33):** Definitely. Equipment availability is a serious concern. In physics, for instance, many items are on display but no longer functional because they were damaged and never replaced. When equipment is unavailable, students cannot conduct hands-on experiments, which disrupts their learning and the laboratory schedule. Tracking is also an issue — without a 

_STI College Cotabato_ 

55 

system, no one knows who borrowed what. A proper borrowing system would resolve all of these. 

**Bin Fhaeid Mambao (09:03):** If equipment is damaged during a laboratory activity, how should it be reported and managed? 

**Ma'am Rayhanah M. Tiag (09:40):** It should be reported directly to the person managing the laboratory — in our case, Sir Brock — and also to the admin, so they are aware of what is damaged or missing. The admin needs to know the full status of laboratory equipment at all times. 

**Bin Fhaeid Mambao (10:09):** Do you think the system should send an SMS notification when equipment is damaged? 

**Ma'am Rayhanah M. Tiag (10:43):** Yes, that is very necessary. It keeps the admin informed in real time about what has been damaged, so they can act promptly. 

**Bin Fhaeid Mambao (11:08):** How do you think borrowing requests should be approved? Who should be responsible? 

**Ma'am Rayhanah M. Tiag (11:24):** There should be one authorized person who 

handles the laboratory — whoever is designated to manage and monitor all the equipment in that specific laboratory. That person  should approve borrowing requests. 

**Bin Fhaeid Mambao (11:55):** Do you think this system will be helpful for students? 

**Ma'am Rayhanah M. Tiag (12:11):** Yes, it will be very helpful. It promotes discipline among students and sets limits on the usage of laboratory equipment. It 

_STI College Cotabato_ 

56 

also benefits teachers since it allows monitoring of what is being borrowed. Overall, it helps maintain the equipment and fosters a culture of responsibility within the institution. 

**Bin Fhaeid Mambao (12:58):** Are there any additional features you would like to see in the system? 

**Ma'am Rayhanah M. Tiag (13:21):** The system should have real-time availability monitoring of all laboratory apparatus. It should track when items were borrowed, and returned, and flag any that have not been returned. This is especially useful even when there is no laboratory technician physically present — the system can serve as the monitoring mechanism. 

**Bin Fhaeid Mambao (13:46):** For notifications, would you prefer SMS or email? 

**Ma'am Rayhanah M. Tiag (14:05):** SMS is fine. But ideally, the system should have a dedicated interface where all laboratory apparatus are categorized and listed, so you can see which items are available, which are borrowed, and when they were returned. That would be the most useful feature. 

##### **Interview Transcript 3** 

**Interviewer:** Clerk Shane S. Baroy (Clerk) 

**Respondent:** Sir Abdulnaem Balabagan — Science Instructor, STI College Cotabato 

Context: Semi-structured interview on borrowing approval process, equipment accountability, and SMS notification preferences. 

##### **Transcript:** 

_STI College Cotabato_ 

57 

**Clerk (Interviewer) (00:02):** Good day, Sir. The purpose of this interview is to identify possible issues in equipment management and gather requirements for our proposed Engineering Laboratory Management System. My first question is: Are you familiar with how laboratory equipment borrowing is supposed to work in your institution? 

**Sir Abdulnaem Balabagan (00:27):** Yes. As a science instructor, I regularly use various apparatus and laboratory materials. Before borrowing, you need to know the proper procedures — what is allowed and what is not — when borrowing materials or apparatus in the laboratory. 

**Clerk (Interviewer) (01:06):** Since formal borrowing is not yet practiced in the laboratory, how do you usually handle equipment needs during your classes? 

**Sir Abdulnaem Balabagan (01:36):** Since I am also the one managing the laboratory, I do not formally borrow from anyone. During laboratory activities, I simply retrieve the equipment as needed because I am the one responsible for managing it. 

**Clerk (Interviewer) (02:43):** If a proper borrowing system were implemented, how do you think the process should work from request to return? 

**Sir Abdulnaem Balabagan (02:56):** The borrower must first list all the equipment they intend to borrow. Before borrowing, they should be fully aware of what they need and commit to returning everything in proper condition. They should go through the facilitator — whoever manages the laboratory — and submit a request form for the apparatus they want to borrow. Returning the items should also be done at the same point, to the same facilitator. 

_STI College Cotabato_ 

58 

**Clerk (Interviewer) (03:59):** What role should faculty members have in the borrowing process? 

**Sir Abdulnaem Balabagan (04:06):** The primary role of faculty is to take care of whatever they borrow. Equipment is not handed out carelessly — there must be an approval process, and someone must be accountable if something is damaged, broken, or lost. Without approval and a guarantor, equipment should not be lent to students. The approval process allows you to trace who last used the item and who is responsible for returning it. 

**Clerk (Interviewer) (06:06):** What problems do you think could arise when students start borrowing equipment, given that this system has not yet been implemented? 

**Sir Abdulnaem Balabagan (06:27):** First, students should not be able to borrow laboratory equipment — particularly chemistry apparatus — on their own. Only faculty, teachers, or advisors should be authorized to borrow on behalf of students. If students were to borrow on their own through the web-based system, one major problem is that the system cannot physically check whether the returned item is still in good condition. Unlike a laboratory technician who can visually inspect the equipment, the system can only log that it was returned — it cannot verify if it is broken or damaged. 

**Clerk (Interviewer) (10:17):** How should the following situations be handled: equipment not available, multiple users requesting the same item, and items returned late or not returned? 

_STI College Cotabato_ 

59 

**Sir Abdulnaem Balabagan (10:36):** For equipment not available: all equipment in this institution is aligned with the ELMS activities. If something is needed that is not currently available, it is proposed to the admin for procurement. Equipment is not just purchased randomly — it must align with laboratory activities. To prevent multiple users from requesting the same item, plan ahead. Before the semester, I already knew what activities would take place, how many groups there were, and what materials were needed. With proper scheduling and planning, conflicts rarely occur. For items not returned on time: I have not personally encountered this, but the system should have a policy requiring items to be returned at a specific time. If violations occur, both the student and the responsible faculty member are accountable — because it is the faculty who initially requests the equipment on behalf of the class. 

**Clerk (Interviewer) (18:34):** How do you think borrowing requests should be approved through the system? 

**Sir Abdulnaem Balabagan (18:56):** Requests should not be auto-approved by the system. The approval must come from the person in charge — in our case, Sir Brot, who is the Custodian of our facilities. The system should serve as a channel that routes requests to him for approval. Even with the system, a person still needs physically release the equipment after approval. 

**Clerk (Interviewer) (21:49):** Do you think return notifications are necessary? 

**Sir Abdulnaem Balabagan (21:58):** Yes, absolutely. Notifications should be sent 

at least a day before the return deadline, and again on the day of return. Without notifications, borrowers might forget. If they receive a reminder the day before 

_STI College Cotabato_ 

60 

and again on the due date, they have no excuse for forgetting. Notifications make the process significantly more responsible. 

**Clerk (Interviewer) (23:19):** What type of notifications would you prefer — SMS or email? 

**Sir Abdulnaem Balabagan (23:35):** SMS is far better. Emails sometimes do not 

pop up unless you open them. SMS appears directly on the phone or laptop screen. Even without an internet connection, SMS still works. Messenger notifications can be overlooked, but SMS is more reliable and direct. 

**Clerk (Interviewer) (24:38):** Do you think this web-based system will be helpful for students and faculty? 

**Sir Abdulnaem Balabagan (24:50):** Yes. Not only does it address the inconvenience of having to physically locate Sir Brock every time you need to borrow something, but it also allows reservations. You can reserve equipment for next week's activities before anyone else does. It eliminates the hassle of waiting in line or going to different offices. The system is a win-win for everyone. 

**Clerk (Interviewer) (25:54):** Are there any additional features you would like to suggest? 

**Sir Abdulnaem Balabagan (26:02):** The most important thing is accuracy — the data must always be up to date. At the very least, it should be updated every semester, reflecting which items are available, damaged, in use, or vacant. The system should be accurate, convenient, easy to use for both students and faculty, and accessible to all. The process for submitting a request should be 

_STI College Cotabato_ 

61 

straightforward, as few steps as possible. If you want to borrow, go to the system, 

request, and it goes directly to the admin — no unnecessary steps. 

##### **Interview Transcript 4** 

**Interviewer:** Clerk Shane S. Baroy (Clerk) 

**Respondent:** Sir Roland Carl A. Denopol, PCpe — Engineering Instructor, STI College Cotabato 

**Context:** Semi-structured interview on laboratory workflow, equipment availability, borrowing and accountability processes, damage reporting, and system improvement suggestions for the proposed Engineering Laboratory Management System. 



##### **Transcript:** 

**Interviewer (00:07):** We are the ECP group, developers of a web-based engineering laboratory management system. The purpose of this interview is to identify actual workflows, challenges, and the current system. 

**Interviewer (00:26):** How laboratory management works in engineering. First, sir, is the laboratory workflow. 

##### **Laboratory Workflow** 

**Interviewer (00:45):** Can you describe how a typical computer engineering laboratory session is conducted from preparation to completion? 

**Sir Roland Carl A. Denopol, PCpe (00:54):** In computer engineering laboratories, preparation is done based on the required materials for each subject. Faculty usually do not request borrowing. This is because activities are conducted during class sessions, and the assigned faculty automatically prepares the 

_STI College Cotabato_ 

62 

necessary materials based on the subject requirements. In the current process, there is no borrowing list for faculty. Only students are allowed to use a borrowing form. After the activity, the faculty returns the borrowed equipment to the proper storage area. That is the process. 

##### **Equipment Availability Before Lab** 

**Interviewer (01:51):** Before conducting a lab, how do you ensure all required equipment is available? 

**Sir Roland Carl A. Denopol, PCpe (02:01):** We manually check the equipment. Before any activity, the faculty checks if all required equipment is available. If something is missing, we adjust or require students to bring the missing components. 

##### **Equipment Shortage Experience** 

**Interviewer (02:39):** Have you experienced situations where required equipment was unavailable or insufficient? 

**Sir Roland Carl A. Denopol, PCpe (02:49):** Yes, many times. Equipment is either missing or unavailable, sometimes because it was used by other faculty and not returned. When this happens, we try to locate the equipment. If it cannot be found, we ask students to bring the needed components. If no equipment is still available, we adjust the number of groups. For example, if there are only 5 sets available but 10 groups, we either reduce the numbers of groups or regroup the students. Sometimes, students take turns borrowing equipment, which leads to delays and waiting. 

##### **Equipment Usage, Organization, and Tracking** 

**Interviewer (04:11):** How do you monitor or record the use of laboratory equipment? 

_STI College Cotabato_ 

63 

**Sir Roland Carl A. Denopol, PCpe (04:35):** Everything is manually counted and checked manually. We list everything manually, then encode it into Excel for inventory reporting. We also re-check and re-count everything ourselves. 

##### **Tracking Equipment Usage** 

**Interviewer (05:01):** Is there a way to identify who last used a specific equipment? 

**Sir Roland Carl A. Denopol, PCpe (05:15):** We identify it only by class schedules and by asking the faculty who last used it. There is no proper system or schedule tracking. Everything is done manually. 

##### **Organization of Equipment** 

**Interviewer (05:59):** How is laboratory equipment organized or grouped? 

**Sir Roland Carl A. Denopol, PCpe (06:15):** It is difficult because we deal with small components. We organize them manually, often using containers like tupperware. We still have to count and rearrange everything one by one, then record it again in Excel. This process takes a lot of time, especially during the end-of-semester inventory. Sometimes we rely on previous reports and manually update them. 

##### **Equipment Damage and Loss** 

**Interviewer (07:34):** Have you experienced cases where equipment was lost, damaged, or returned? How is it handled? 

**Sir Roland Carl A. Denopol, PCpe (07:52):** Yes. During inventory, we check each piece of equipment individually to see if it is still in good condition. If damaged, we categorize it as repairable or not. Reports are made manually and printed for submission. 

##### **Borrowing and Accountability** 

_STI College Cotabato_ 

64 

**Interviewer (08:21):** Do you allow students to borrow equipment? 

**Sir Roland Carl A. Denopol, PCpe (08:35):** Yes, we have a borrowing form. Students fill it out, specify the equipment and return date, and sign it for approval. However, there is no transparency between departments, which sometimes causes issues. 

##### **Required Information for Borrowing** 

**Interviewer (10:05):** What information should always be recorded when equipment is used or assigned? 

**Sir Roland Carl A. Denopol, PCpe (10:17):** We need to record: Who used the equipment, what condition it was in when borrowed, and what condition it was returned in. Sometimes equipment is returned damaged even if it was working before. 

##### **Responsibility and Accountability** 

**Interviewer (10:48):** Who is responsible when equipment is damaged or not returned? 

**Sir Roland Carl A. Denopol, PCpe (10:55):** If damage is due to normal wear and tear, it is just reported. But if it is due to student negligence, the student must replace the exact component. We do not collect money; the item must be replaced. Students are reminded to handle equipment carefully and are held accountable for any damage that occurs during borrowing. 

##### **Availability and Scheduling** 

**Interviewer (12:05):** How do you check equipment availability before use? 

**Sir Roland Carl A. Denopol, PCpe (12:15):** We check manually before every activity. 

##### **Conflicts in Usage** 

_STI College Cotabato_ 

65 

**Interviewer (12:26):** Have you experienced conflicts where multiple classes need the same equipment? 

**Sir Roland Carl A. Denopol, PCpe (12:32):** No major conflicts, but delays happen when equipment is not returned. 

##### **Impact on Teaching** 

**Sir Roland Carl A. Denopol, PCpe (13:30):** Equipment unavailability affects teaching because students cannot perform activities. We sometimes adjust schedules or ask students to bring any missing materials to the next meeting. 

##### **Communication Issues** 

**Interviewer (15:11):** Have communication issues caused delays? 

**Sir Roland Carl A. Denopol, PCpe (15:22):** Yes. When teachers are not informed about borrowed or damaged equipment, it affects their class activities. 

##### **System Improvement Suggestions** 

**Sir Roland Carl A. Denopol, PCpe (16:20):** A system showing equipment availability would help a lot. Teachers can immediately adjust activities and ask students to bring the necessary materials. 

##### **Accountability Improvement** 

**Sir Roland Carl A. Denopol, PCpe (17:14):** If the system tracks usage, it will be easier to identify who used or borrowed equipment. 

##### **Notifications** 

**Sir Roland Carl A. Denopol, PCpe (18:07):** Notifications for returns and overdue items would reduce misinformation and conflicts. Currently, there is no penalty system, only reminders and verbal follow-ups. 

##### **Categorized System Benefits** 

_STI College Cotabato_ 

66 

**Sir Roland Carl A. Denopol, PCpe (19:44):** A structured system would make it easier to track inventory, monitor availability, and request new equipment. 

##### **Final Insights** 

**Sir Roland Carl A. Denopol, PCpe (20:31):** The main problems are inventory management and identifying damaged equipment. This causes delays in clearance and reporting, especially during end-of-year inventory. 

##### **Suggested Solution** 

**Sir Roland Carl A. Denopol, PCpe (21:21):** We need a proper system for borrowing, scheduling, inventory, and damage reporting. This will make laboratory management easier and more efficient. 

##### **Admin and Roles** 

**Sir Roland Carl A. Denopol, PCpe (21:50):** Faculty should manage monitoring. Each department should have assigned admins. Each subject (e.g., engineering, chemistry) should have lead admins who can manage equipment, while other faculty have limited access. 

##### **System Access for Students** 

**Sir Roland Carl A. Denopol, PCpe (25:04):** Students can be enrolled based on their subjects. Engineering students can access engineering equipment, while chemistry students can access chemistry equipment. Login can be through student ID numbers. 

##### **Closing** 

**Interviewer (26:37):** Thank you, sir. Your answers are very helpful. 

_STI College Cotabato_ 

67 

##### **APPENDIX B. PERSONAL TECHNICAL VITAE** 

_STI College Cotabato_ 

68 

Curriculum Vitae of 

### MARJUAN S. ETING 

Poblacion VII, Cotabato City, Maguindanao marjuansanan18@gmail.com **contact number either cellular phone or landline or both** 

EDUCATIONAL BACKGROUND Level Inclusive Dates Name of school/ Institution Tertiary 2022-2023 Notre Dame University (NDU) 2023-Present STI College Cotabato Senior High School 2020-2022 Notre Dame of Cotabato (NDC) High School 2016-2020 Notre Dame of Cotabato (NDC) Elementary 2010-2016 Cotabato City Central Pilot School (CCCPS) 

###### PROFESSIONAL OR VOLUNTEER EXPERIENCE 

Nature of Experience/ Inclusive Dates Job Title month year month year month year month year 

Name and Address of Company or Organization 

**Listed in reverse chronological order (most recent first).** 

AFFILIATIONS Inclusive Dates Name of Organization Position month year month year month year month year 

**Listed in reverse chronological order (most recent first).** 

SKILLS 

SKILLS Level of Competency Date Acquired month year month year month year 

TRAININGS, SEMINARS, OR WORKSHOPS ATTENDED Inclusive Dates Title of Training, Seminar, or Workshop month year month year month year month year 

**Listed in reverse chronological order (most recent first).** 

_STI College Cotabato_ 

69 

Curriculum Vitae of 

**<complete address>** binfhaeid@gmail.com 

### BIN FHAEID B. MAMBAO 

###### **contact number either cellular phone or landline or both** 

EDUCATIONAL BACKGROUND Level Inclusive Dates Name of school/ Institution Tertiary 2023-Present STI College Cotabato Senior High School 2021-2023 Cotabato City National High School -Main Campus (CCNHS -Main) High School 2017-2021 Cotabato City National High School -Main Campus (CCNHS -Main) Elementary 2011-2017 Kimpo Elementary School 

###### PROFESSIONAL OR VOLUNTEER EXPERIENCE 

Nature of Experience/ Inclusive Dates Job Title month year month year month year month year 

Name and Address of Company or Organization 

**Listed in reverse chronological order (most recent first).** 

AFFILIATIONS Inclusive Dates Name of Organization Position month year month year month year month year 

**Listed in reverse chronological order (most recent first).** 

SKILLS 

SKILLS Level of Competency Date Acquired month year month year month year 

TRAININGS, SEMINARS, OR WORKSHOPS ATTENDED Inclusive Dates Title of Training, Seminar, or Workshop month year month year month year month year 

**Listed in reverse chronological order (most recent first).** 

_STI College Cotabato_ 

70 

Curriculum Vitae of 

### JHON MICHAEL L. JUMAANI 

###### **<complete address>** jumaanimichael123@gmail.com **contact number either cellular phone or landline or both** 

||EDUCATIONAL<br>|BACKGROUND<br>|
|---|---|---|
|Level|Inclusive Dates|Name of school/ Institution|
|Tertiary|2022-Present|STI College Cotabato|
|Senior High School|2020-2022|Cotabato City National High School|
|||-Main Campus (CCNHS -Main)|
|High School|2016-2020|Cotabato City National High School<br>-Main Campus (CCNHS -Main)|
|Elementary|2010-2016|Sero Central Elementary School|



###### PROFESSIONAL OR VOLUNTEER EXPERIENCE 

Nature of Experience/ Inclusive Dates Job Title month year month year month year month year 

Name and Address of Company or Organization 

**Listed in reverse chronological order (most recent first).** 

AFFILIATIONS Inclusive Dates Name of Organization Position month year month year month year month year 

**Listed in reverse chronological order (most recent first).** 

SKILLS 

SKILLS Level of Competency Date Acquired month year month year month year 

TRAININGS, SEMINARS, OR WORKSHOPS ATTENDED Inclusive Dates Title of Training, Seminar, or Workshop month year month year month year month year 

**Listed in reverse chronological order (most recent first).** 

_STI College Cotabato_ 

71 

##### **SPECIMEN SIGNATURES** 

CAPSTONE ADVISER: 

ALMIRAH E. ABANG 



Signature Over Printed Name 

GRAMMARIAN: 

ALHADDINAH J. GUIWAN, LPT 



Signature Over Printed Name 

_STI College Cotabato_ 

72 

