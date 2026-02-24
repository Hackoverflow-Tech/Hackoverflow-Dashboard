-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Feb 17, 2026 at 05:46 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `skillsync_ai`
--

-- --------------------------------------------------------

--
-- Table structure for table `certifications`
--

CREATE TABLE `certifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `issuer` varchar(255) DEFAULT NULL,
  `cert_date` date DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `certifications`
--

INSERT INTO `certifications` (`id`, `user_id`, `title`, `issuer`, `cert_date`, `url`) VALUES
(1, 1, 'Meta Frontend Developer Certificate', 'Meta / Coursera', '2024-01-15', 'https://coursera.org/verify/meta-frontend'),
(2, 2, 'Google UX Design Certificate', 'Google / Coursera', '2023-11-20', 'https://coursera.org/verify/google-ux'),
(3, 3, 'IBM Data Analyst Professional', 'IBM / Coursera', '2023-09-10', 'https://coursera.org/verify/ibm-data'),
(4, 4, 'Spring Professional Certification', 'VMware / Broadcom', '2024-03-05', 'https://vmware.com/certification/spring'),
(5, 5, 'AWS Solutions Architect Associate', 'Amazon Web Services', '2023-12-01', 'https://aws.amazon.com/certification/verify'),
(7, 7, 'Python for Everybody', 'University of Michigan / Coursera', '2024-03-15', 'https://coursera.org/verify/python-everybody'),
(8, 6, 'Responsive Web Design', 'freeCodeCamp', '2024-08-01', 'https://freecodecamp.org/certification/nirav/responsive-web-design');

-- --------------------------------------------------------

--
-- Table structure for table `education`
--

CREATE TABLE `education` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `institution` varchar(255) DEFAULT NULL,
  `degree` varchar(255) DEFAULT NULL,
  `field_of_study` varchar(255) DEFAULT NULL,
  `start_year` varchar(10) DEFAULT NULL,
  `end_year` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `education`
--

INSERT INTO `education` (`id`, `user_id`, `institution`, `degree`, `field_of_study`, `start_year`, `end_year`) VALUES
(1, 1, 'RV College of Engineering', 'Bachelor of Engineering', 'Computer Science', '2020', '2024'),
(2, 2, 'Symbiosis Institute of Technology', 'Bachelor of Technology', 'Information Technology', '2020', '2024'),
(3, 3, 'VJTI Mumbai', 'Bachelor of Engineering', 'Electronics & CS', '2019', '2023'),
(4, 4, 'BITS Pilani Hyderabad', 'Bachelor of Engineering', 'Computer Science', '2020', '2024'),
(5, 5, 'Nirma University', 'Bachelor of Technology', 'Information Technology', '2019', '2023'),
(7, 7, 'Pillai HOC College of Arts Commerce and Science', 'Bachelor of Science', 'Data Science', '2021', '2025'),
(8, 6, 'University of Mumbai', 'Bachelor of Science', 'Information Technology', '2023', '2026');

-- --------------------------------------------------------

--
-- Table structure for table `experience`
--

CREATE TABLE `experience` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `company` varchar(255) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `experience`
--

INSERT INTO `experience` (`id`, `user_id`, `company`, `position`, `start_date`, `end_date`, `description`) VALUES
(1, 1, 'Infosys', 'Software Engineer Intern', '2023-06-01', '2023-08-31', 'Built internal dashboard features using React and Node.js. Optimised API response times by 30% through query caching and strategic indexing. Collaborated in an Agile team of 8 engineers.'),
(2, 2, 'Zeta Suite', 'UI/UX Design Intern', '2023-05-01', '2023-07-31', 'Redesigned the onboarding flow for a B2B SaaS product. Conducted 12 user interviews, created wireframes and high-fidelity prototypes in Figma, and reduced drop-off rate by 24%.'),
(3, 3, 'Razorpay', 'Data Analyst Intern', '2022-12-01', '2023-03-31', 'Analysed 5M+ transaction records using Python and SQL. Built Power BI dashboards tracking payment success rates, used weekly by senior leadership to guide product decisions.'),
(4, 4, 'Freshworks', 'Backend Developer Intern', '2023-07-01', '2023-12-31', 'Developed and maintained Spring Boot microservices handling 500k+ daily API calls. Integrated Kafka event streams for async order processing, reducing average latency by 22%.'),
(5, 5, 'Jio Platforms', 'DevOps Intern', '2022-10-01', '2023-03-31', 'Managed CI/CD pipelines for 8 internal services using Jenkins and GitHub Actions. Containerised legacy apps with Docker, cutting infrastructure costs by 15% and deployment time by 35%.'),
(7, 7, 'QUASCO LTD', 'Backend Intern', '2024-06-01', '2024-08-31', 'Worked on hardware networking infrastructure and backend systems. Assisted in building internal tools using Python and MySQL. Gained hands-on experience with server management and REST API development.'),
(8, 6, 'Skillsync AI', 'Full Stack Developer', '2025-09-01', NULL, 'Building Skillsync AI from the ground up — a full-stack PHP/MySQL application with AI-powered resume building, job recommendations, and career insights. Responsible for architecture, UI design, and backend logic.');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `company` varchar(255) NOT NULL,
  `position` varchar(255) NOT NULL,
  `working_hours` varchar(50) NOT NULL,
  `contact` varchar(20) NOT NULL,
  `description` text NOT NULL,
  `vacancies` int(5) NOT NULL,
  `location` varchar(255) DEFAULT 'Not Specified',
  `type` varchar(100) DEFAULT 'Full-time',
  `salary` varchar(100) DEFAULT 'Negotiable',
  `posted_on` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `jobs`
--

INSERT INTO `jobs` (`id`, `user_id`, `title`, `company`, `position`, `working_hours`, `contact`, `description`, `vacancies`, `location`, `type`, `salary`, `posted_on`) VALUES
(1, 1, 'Frontend Developer', 'TechSoft Solutions', 'Software Engineer', '9AM–6PM', '9876543210', 'Build responsive SPAs using React and TypeScript. Work closely with the design team to implement pixel-perfect UI components and improve Core Web Vitals scores.', 2, 'Bangalore', 'Full-time', '₹6L–₹9L', '2026-01-10'),
(2, 2, 'UI/UX Designer', 'Zeta Suite', 'Product Designer', '10AM–7PM', '8765432109', 'Own the end-to-end design process from user research to high-fidelity prototypes in Figma. Collaborate with engineers for smooth developer handoff and design system maintenance.', 1, 'Pune', 'Full-time', '₹5L–₹8L', '2026-01-14'),
(3, 3, 'Data Analyst', 'Razorpay', 'Business Analyst', '9AM–6PM', '9123456780', 'Analyse large payment datasets using Python and SQL. Build and maintain Power BI and Tableau dashboards. Present actionable insights to product and leadership teams weekly.', 2, 'Mumbai', 'Full-time', '₹7L–₹11L', '2026-01-18'),
(4, 4, 'Backend Engineer', 'Freshworks', 'Software Engineer II', '9AM–6PM', '9988776655', 'Design and maintain Java Spring Boot microservices. Own reliability for APIs handling 500k+ daily requests. Participate in on-call rotation and drive performance improvements.', 2, 'Hyderabad', 'Full-time', '₹10L–₹16L', '2026-01-20'),
(5, 5, 'DevOps Engineer', 'Jio Platforms', 'Senior DevOps', '10AM–7PM', '9001122334', 'Manage production Kubernetes clusters on AWS, maintain CI/CD pipelines, and drive IaC adoption with Terraform. Mentor junior engineers and lead on-call response.', 1, 'Ahmedabad', 'Full-time', '₹12L–₹18L', '2026-01-22'),
(6, 1, 'React Native Developer', 'AppVerse', 'Mobile Developer', '9AM–6PM', '9871234560', 'Build and maintain cross-platform mobile apps for iOS and Android. Integrate REST APIs, implement push notifications, and optimise app performance and bundle size.', 3, 'Remote', 'Full-time', '₹7L–₹12L', '2026-01-25'),
(7, 2, 'Product Designer Intern', 'FinPeak', 'Design Intern', '10AM–5PM', '8761234509', 'Assist the design team with wireframing, user research, and high-fidelity prototyping. Ideal for final-year students looking for real ownership and mentorship.', 2, 'Pune', 'Internship', '₹15,000/month', '2026-01-28'),
(8, 3, 'ML Engineer', 'DataMind AI', 'AI Engineer', '9AM–6PM', '9120987650', 'Build and deploy ML models for NLP and recommendation systems. Own the full MLOps lifecycle from training to monitoring in production. Python and cloud experience required.', 1, 'Bangalore', 'Full-time', '₹14L–₹20L', '2026-02-01'),
(9, 4, 'Java Developer', 'SAP Labs India', 'Associate Developer', '9AM–6PM', '9980123450', 'Work on enterprise ERP modules using Java and Spring Framework. Strong OOP fundamentals and understanding of design patterns required. Great mentorship programme.', 4, 'Hyderabad', 'Full-time', '₹8L–₹13L', '2026-02-03'),
(10, 5, 'Cloud Infrastructure Intern', 'AWS India', 'Cloud Intern', '9AM–5PM', '9001000001', 'Assist cloud engineers with infrastructure provisioning, cost optimisation, and monitoring. Basic AWS knowledge and Linux comfort required. Potential for PPO.', 2, 'Ahmedabad', 'Internship', '₹20,000/month', '2026-02-05'),
(11, 1, 'Full Stack Developer', 'Innovatech', 'Software Engineer', '9AM–6PM', '9870001234', 'Own features end-to-end across a React frontend and Node.js backend. Agile team, strong engineering culture, remote-friendly with quarterly off-sites.', 3, 'Remote', 'Full-time', '₹9L–₹15L', '2026-02-08'),
(12, 2, 'Frontend Intern', 'Groww', 'Engineering Intern', '10AM–5PM', '8760001234', 'Work on Groww\'s investor-facing web platform using React and Next.js. Real ownership from day one with strong mentorship. High-performance engineering environment.', 2, 'Bangalore', 'Internship', '₹25,000/month', '2026-02-10');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `project_name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `technologies` varchar(255) DEFAULT NULL,
  `project_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `user_id`, `project_name`, `description`, `technologies`, `project_url`) VALUES
(1, 1, 'DevCollab', 'Real-time collaborative code editor with syntax highlighting, room-based sessions, and GitHub OAuth. Supports 5 programming languages with live cursor sharing.', 'React, Node.js, Socket.io, Monaco Editor, PostgreSQL', 'https://github.com/aryanmehta/devcollab'),
(2, 2, 'MoodBoard AI', 'AI-assisted design tool where users input a brief and the app generates colour palettes, font pairings, and layout suggestions. 300+ active users.', 'Vue.js, Tailwind CSS, OpenAI API, Firebase', 'https://github.com/priyasharma/moodboard-ai'),
(3, 3, 'ChurnShield', 'Customer churn prediction model using gradient boosting. Achieved 87% accuracy on a 50k-row telecom dataset. Includes an interactive Power BI dashboard for stakeholders.', 'Python, XGBoost, Scikit-learn, Power BI, Pandas', 'https://github.com/rohandesai/churnshield'),
(4, 4, 'QuickCart API', 'Production-grade REST API for an e-commerce platform with JWT auth, role-based access control, inventory management, and Kafka-based order processing.', 'Java, Spring Boot, MySQL, Redis, Docker, Kafka', 'https://github.com/snehakulkarni/quickcart-api'),
(5, 5, 'InfraKit', 'Open-source Terraform module library for spinning up opinionated AWS environments (VPC, EKS, RDS) with a single command. 200+ GitHub stars.', 'Terraform, AWS, Kubernetes, Bash, GitHub Actions', 'https://github.com/karanpatel/infrakit'),
(7, 7, 'QUASCO Network Dashboard', 'Internal dashboard for monitoring hardware networking components and server health metrics. Included real-time alerts and uptime tracking.', 'Python, Flask, MySQL, HTML/CSS', ''),
(8, 6, 'Skillsync AI', 'An AI-powered resume builder and career platform with job recommendations, skill suggestions, and a chatbot assistant. Built end-to-end as a college project.', 'PHP, MySQL, JavaScript, Tailwind CSS, Perplexity AI', 'https://github.com/niravthakur/skillsync');

-- --------------------------------------------------------

--
-- Table structure for table `skills`
--

CREATE TABLE `skills` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `skill_name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `skills`
--

INSERT INTO `skills` (`id`, `user_id`, `skill_name`) VALUES
(1, 1, 'React'),
(2, 1, 'Node.js'),
(3, 1, 'TypeScript'),
(4, 1, 'PostgreSQL'),
(5, 1, 'Docker'),
(6, 1, 'REST APIs'),
(7, 1, 'Redis'),
(8, 1, 'GraphQL'),
(9, 2, 'Figma'),
(10, 2, 'Vue.js'),
(11, 2, 'Tailwind CSS'),
(12, 2, 'Adobe XD'),
(13, 2, 'HTML/CSS'),
(14, 2, 'JavaScript'),
(15, 2, 'Storybook'),
(16, 2, 'Accessibility Design'),
(17, 3, 'Python'),
(18, 3, 'SQL'),
(19, 3, 'Power BI'),
(20, 3, 'Pandas'),
(21, 3, 'Tableau'),
(22, 3, 'NumPy'),
(23, 3, 'Scikit-learn'),
(24, 3, 'Excel'),
(25, 4, 'Java'),
(26, 4, 'Spring Boot'),
(27, 4, 'Kafka'),
(28, 4, 'MySQL'),
(29, 4, 'REST APIs'),
(30, 4, 'Redis'),
(31, 4, 'JUnit'),
(32, 4, 'Microservices'),
(33, 5, 'Docker'),
(34, 5, 'Kubernetes'),
(35, 5, 'Terraform'),
(36, 5, 'AWS'),
(37, 5, 'GitHub Actions'),
(38, 5, 'Jenkins'),
(39, 5, 'Linux'),
(40, 5, 'Prometheus'),
(49, 7, 'Python'),
(50, 7, 'Django'),
(51, 7, 'MySQL'),
(52, 7, 'REST APIs'),
(53, 7, 'Linux'),
(54, 7, 'Java'),
(55, 7, 'Git'),
(56, 7, 'Postman'),
(57, 6, 'React'),
(58, 6, 'PHP'),
(59, 6, 'MySQL'),
(60, 6, 'JavaScript'),
(61, 6, 'Tailwind CSS'),
(62, 6, 'Node.js'),
(63, 6, 'Python'),
(64, 6, 'Git');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `headline` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `profile_complete` tinyint(1) NOT NULL DEFAULT 0,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `headline`, `location`, `email`, `phone`, `profile_picture`, `bio`, `profile_complete`, `password`, `created_at`) VALUES
(1, 'Aryan Mehta', 'Full Stack Developer', 'Bangalore, India', 'aryan.mehta@gmail.com', '9876543210', NULL, 'Full stack developer with 3 years of experience building scalable web applications using React, Node.js, and PostgreSQL. Passionate about clean code, open source, and solving real-world problems through technology. Currently exploring ML integration in production systems.', 1, 'Aryan@2005', '2025-06-12 08:30:00'),
(2, 'Priya Sharma', 'UI/UX Designer & Frontend Developer', 'Pune, India', 'priya.sharma@outlook.com', '8765432109', NULL, 'Creative UI/UX designer with a strong frontend background in Figma, Tailwind CSS, and Vue.js. I believe great design is invisible — it just works. 2× hackathon winner and design mentor obsessed with micro-interactions and accessibility.', 1, 'Priya@2005', '2025-07-04 10:15:00'),
(3, 'Rohan Desai', 'Data Analyst | Python & SQL', 'Mumbai, India', 'rohan.desai@yahoo.com', '9123456780', NULL, 'Data analyst with hands-on experience in Python, SQL, and Power BI. Helped a fintech startup reduce customer churn by 18% through cohort analysis and predictive modelling. Pursuing ML certifications and exploring data engineering roles.', 1, 'Rohan@2005', '2025-08-20 13:45:00'),
(4, 'Sneha Kulkarni', 'Backend Engineer | Java & Spring Boot', 'Hyderabad, India', 'sneha.kulkarni@gmail.com', '9988776655', NULL, 'Backend engineer specialising in Java microservices and Spring Boot. 2 years of industry experience at a SaaS company building REST APIs serving 100k+ daily users. Strong interest in distributed systems, Kafka, and AWS cloud infrastructure.', 1, 'Sneha@2005', '2025-09-01 09:00:00'),
(5, 'Karan Patel', 'DevOps & Cloud Engineer', 'Ahmedabad, India', 'karan.patel@protonmail.com', '9001122334', NULL, 'DevOps engineer with deep expertise in Docker, Kubernetes, and CI/CD pipelines using GitHub Actions and Jenkins. AWS Solutions Architect Associate certified. Reduced deployment time by 40% through containerisation and Terraform IaC.', 1, 'Karan@2005', '2025-10-10 11:30:00'),
(6, 'Nirav Thakur', 'Full Stack Developer & AI Enthusiast', 'Mumbai, India', 'niravthakur2005@gmail.com', '9653472213', NULL, 'Full stack developer passionate about building AI-powered web applications. Currently working on Skillsync AI — a platform that helps job seekers build smarter resumes and discover opportunities. Love clean UI, dark themes, and turning ideas into real products.', 1, 'nirav', '2026-02-17 09:10:11'),
(7, 'Lawrance Johnwilson Nadar', 'Backend Developer', 'Mumbai, India', 'lawrencejohnwilson28624@gmail.com', '9653472942', NULL, 'A motivated and adaptable individual seeking to begin my professional journey with an organisation that offers growth opportunities, values creativity, and fosters learning. Eager to apply skills in backend development, discipline, and curiosity to contribute meaningfully to team goals and company success.', 1, 'Lawrence', '2025-09-09 03:36:48');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `certifications`
--
ALTER TABLE `certifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `education`
--
ALTER TABLE `education`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `experience`
--
ALTER TABLE `experience`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `skills`
--
ALTER TABLE `skills`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `certifications`
--
ALTER TABLE `certifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `education`
--
ALTER TABLE `education`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `experience`
--
ALTER TABLE `experience`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `skills`
--
ALTER TABLE `skills`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `certifications`
--
ALTER TABLE `certifications`
  ADD CONSTRAINT `certifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `education`
--
ALTER TABLE `education`
  ADD CONSTRAINT `education_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `experience`
--
ALTER TABLE `experience`
  ADD CONSTRAINT `experience_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `skills`
--
ALTER TABLE `skills`
  ADD CONSTRAINT `skills_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
