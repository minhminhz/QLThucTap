const app = require('../backend/app');
const http = require('http');

let server;

async function runTests() {
    const port = 5055;
    server = app.listen(port);
    const baseUrl = `http://localhost:${port}`;

    async function req(path, options = {}) {
        const url = `${baseUrl}${path}`;
        const res = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });
        const data = await res.json().catch(() => null);
        return { status: res.status, data };
    }

    console.log('--- TEST 1: Health check ---');
    const health = await req('/api/health');
    console.log('Health check:', health.status, health.data.message);
    if (health.status !== 200) throw new Error('Health check failed');

    console.log('\n--- TEST 2: Public Branches & Positions ---');
    const branches = await req('/api/branches');
    console.log('Branches status:', branches.status, 'Count:', branches.data.data.length);
    const positions = await req('/api/positions');
    console.log('Positions status:', positions.status, 'Count:', positions.data.data.length);

    console.log('\n--- TEST 3: Login as ADMIN ---');
    const adminLogin = await req('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'admin@vymi.tech', password: '123456' })
    });
    console.log('Admin login:', adminLogin.status, 'Role:', adminLogin.data.data?.user?.role);
    const adminToken = adminLogin.data.data.token;

    console.log('\n--- TEST 4: Login as HR Hanoi ---');
    const hrLogin = await req('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'hr.hanoi@vymi.tech', password: '123456' })
    });
    console.log('HR Hanoi login:', hrLogin.status, 'Branch:', hrLogin.data.data?.user?.branch_name);
    const hrToken = hrLogin.data.data.token;

    console.log('\n--- TEST 5: Login as Mentor HN1 ---');
    const mentorLogin = await req('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'mentor.hn1@vymi.tech', password: '123456' })
    });
    console.log('Mentor login:', mentorLogin.status, 'Role:', mentorLogin.data.data?.user?.role);
    const mentorToken = mentorLogin.data.data.token;

    console.log('\n--- TEST 6: Login as Intern HN ---');
    const internLogin = await req('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'intern.hn@vymi.tech', password: '123456' })
    });
    console.log('Intern login:', internLogin.status, 'Role:', internLogin.data.data?.user?.role);
    const internToken = internLogin.data.data.token;

    console.log('\n--- TEST 7: Login as Applicant 1 ---');
    const applicantLogin = await req('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'applicant1@gmail.com', password: '123456' })
    });
    console.log('Applicant login:', applicantLogin.status, 'Role:', applicantLogin.data.data?.user?.role);
    const applicantToken = applicantLogin.data.data.token;

    console.log('\n--- TEST 8: Authorization check: Applicant calls HR route ---');
    const unauthorizedCheck = await req('/api/hr/dashboard', {
        headers: { Authorization: `Bearer ${applicantToken}` }
    });
    console.log('Applicant accessing HR dashboard status:', unauthorizedCheck.status, '(Expected 403)');
    if (unauthorizedCheck.status !== 403) throw new Error('Authorization test failed! Expected 403');

    console.log('\n--- TEST 9: HR Hanoi dashboard & applications ---');
    const hrDashboard = await req('/api/hr/dashboard', {
        headers: { Authorization: `Bearer ${hrToken}` }
    });
    console.log('HR Hanoi stats:', hrDashboard.status, hrDashboard.data.data);

    console.log('\n--- TEST 10: Mentor HN1 view interns & tasks ---');
    const mentorInterns = await req('/api/mentor/interns', {
        headers: { Authorization: `Bearer ${mentorToken}` }
    });
    console.log('Mentor assigned interns count:', mentorInterns.data.data.length);

    console.log('\n--- TEST 11: Intern HN view tasks ---');
    const internTasks = await req('/api/intern/tasks', {
        headers: { Authorization: `Bearer ${internToken}` }
    });
    console.log('Intern HN tasks count:', internTasks.data.data.length);

    console.log('\n--- ALL BACKEND API TESTS PASSED SUCCESSFULLY! ---');
}

runTests()
    .then(() => {
        if (server) server.close();
        process.exit(0);
    })
    .catch((err) => {
        console.error('Test error:', err);
        if (server) server.close();
        process.exit(1);
    });
