// Mock data for the admin panel

// Mock Admin User
export const MOCK_ADMIN = {
    id: "admin-1",
    name: "Admin",
    email: "admin@vibecoding.ao",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    role: "admin" as const,
};

// Mock Dashboard Stats
export const MOCK_STATS = {
    totalUsers: 1250,
    totalCourses: 5,
    totalLessons: 75,
    totalRevenue: 3750000, // AOA in cents
    activeEnrollments: 890,
    newUsersThisMonth: 145,
};

// Mock Courses
export const MOCK_COURSES = [
    {
        id: "course-1",
        title: "E Vibe Coding 1.0 - Desenvolvimento Web Completo",
        description: "Aprenda desenvolvimento web do zero ao deploy",
        instructorId: "admin-1",
        instructor: "Admin",
        category: "Desenvolvimento Web",
        status: "published" as const,
        price: 60000,
        totalLessons: 15,
        imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400",
        createdAt: "2026-01-01T00:00:00Z",
        studentsCount: 350,
    },
    {
        id: "course-2",
        title: "React Avançado - Padrões e Performance",
        description: "Domine React com técnicas avançadas",
        instructorId: "admin-1",
        instructor: "Admin",
        category: "React",
        status: "draft" as const,
        price: 85000,
        totalLessons: 10,
        imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
        createdAt: "2026-01-15T00:00:00Z",
        studentsCount: 0,
    },
];

// Mock Lessons
export const MOCK_LESSONS = [
    {
        id: "lesson-1",
        courseId: "course-1",
        courseName: "E Vibe Coding 1.0",
        title: "Introdução ao Desenvolvimento Web",
        description: "Conceitos fundamentais do desenvolvimento web moderno",
        thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400",
        order: 1,
        status: "published" as const,
        duration: 45,
        videoUrl: ""
    },
    {
        id: "lesson-2",
        courseId: "course-1",
        courseName: "E Vibe Coding 1.0",
        title: "HTML5 - Estrutura Semântica",
        description: "Aprenda a estruturar páginas com HTML5 semântico",
        thumbnailUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400",
        order: 2,
        status: "published" as const,
        duration: 60,
        videoUrl: ""
    },
    {
        id: "lesson-3",
        courseId: "course-1",
        courseName: "E Vibe Coding 1.0",
        title: "CSS3 - Estilização Avançada",
        description: "Técnicas avançadas de CSS3 para interfaces modernas",
        thumbnailUrl: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=400",
        order: 3,
        status: "published" as const,
        duration: 75,
        videoUrl: ""
    },
    {
        id: "lesson-4",
        courseId: "course-1",
        courseName: "E Vibe Coding 1.0",
        title: "JavaScript - Fundamentos",
        description: "Fundamentos essenciais de JavaScript para iniciantes",
        thumbnailUrl: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400",
        order: 4,
        status: "draft" as const,
        duration: 90,
        videoUrl: ""
    },
    {
        id: "lesson-5",
        courseId: "course-1",
        courseName: "E Vibe Coding 1.0",
        title: "JavaScript - DOM e Eventos",
        description: "Manipulação do DOM e gestão de eventos em JavaScript",
        thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400",
        order: 5,
        status: "draft" as const,
        duration: 80,
        videoUrl: ""
    },
];

// Mock Users
export const MOCK_USERS = [
    { id: "user-1", name: "Maria Santos", email: "maria@email.com", role: "student", createdAt: "2026-01-10T00:00:00Z", enrollments: 2 },
    { id: "user-2", name: "Pedro Costa", email: "pedro@email.com", role: "student", createdAt: "2026-01-12T00:00:00Z", enrollments: 1 },
    { id: "user-3", name: "Ana Silva", email: "ana@email.com", role: "student", createdAt: "2026-01-15T00:00:00Z", enrollments: 3 },
];

// Mock Live Sessions
export const MOCK_LIVE_SESSIONS = [
    {
        id: "live-1",
        title: "Sessão de Dúvidas - React Hooks",
        description: "Tire suas dúvidas sobre React Hooks",
        instructorId: "admin-1",
        courseId: "course-1",
        status: "scheduled",
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        maxParticipants: 100,
    },
];

// Mock Materials
export const MOCK_MATERIALS = [
    { id: "mat-1", lessonId: "lesson-1", title: "Cheat Sheet HTML5", type: "pdf", url: "#", fileSize: 1024000 },
    { id: "mat-2", lessonId: "lesson-2", title: "Guia CSS Flexbox", type: "pdf", url: "#", fileSize: 2048000 },
];

// Mock Community Posts
export const MOCK_COMMUNITY_POSTS = [
    {
        id: "post-1",
        userId: "user-1",
        userName: "Maria Santos",
        content: "Alguém pode me ajudar com Flexbox?",
        status: "published",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        reports: 0,
    },
    {
        id: "post-2",
        userId: "user-2",
        userName: "Pedro Costa",
        content: "Acabei de terminar a aula 5! 🎉",
        status: "published",
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        reports: 0,
    },
];

// Mock Tools
export const MOCK_TOOLS = [
    { id: "tool-1", name: "VS Code Online", type: "ide", description: "Editor de código online", url: "https://vscode.dev", available: true },
    { id: "tool-2", name: "CodePen", type: "ide", description: "Ambiente para experimentos", url: "https://codepen.io", available: true },
];

// Mock Permissions
export const MOCK_PERMISSIONS = [
    { id: "perm-1", name: "courses.create", resource: "courses", action: "create" },
    { id: "perm-2", name: "courses.update", resource: "courses", action: "update" },
    { id: "perm-3", name: "courses.delete", resource: "courses", action: "delete" },
    { id: "perm-4", name: "users.manage", resource: "users", action: "manage" },
];
