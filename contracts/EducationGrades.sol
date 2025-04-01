// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EducationGrades {

    // 定义角色枚举类型
    enum Role { Admin, Teacher, Student, GradeManager }

    // 定义成绩数据结构
    struct Grade {
        string gradeId;         // 成绩数据唯一 ID
        string studentId;       // 学生 ID
        string course;          // 课程名
        uint8 score;            // 成绩分
        uint256 timestamp;      // 录入时间
        address teacher;        // 上传教师
        string status;          // 数据状态，如“有效”
        string remark;          // 可选备注
    }

    // 定义用户数据结构
    struct User {
        string username;        // 用户名
        string email;           // 用户邮箱
        string contactNumber;   // 用户联系号码
        Role role;              // 用户角色
    }

    address public admin;  // 管理员地址
    mapping(address => User) public users;  // 用户表映射：地址 => 用户信息
    mapping(address => Role) public userRoles;  // 地址 => 用户角色
    mapping(string => Grade[]) private studentGrades;  // 成绩数据存储：按学生 ID 映射多个成绩记录

    address[] private userList; // 存储所有用户地址
    
    event GradeUploaded(string indexed gradeId, string studentId, string course, uint8 score, address teacher);
    event GradeStatusUpdated(string indexed gradeId, string newStatus);
    event RoleAssigned(address indexed user, Role role);
    event UserRegistered(address indexed user, string username, string email, string contactNumber);
    
    // 角色权限管理：管理员权限
    modifier onlyAdmin() {
        require(userRoles[msg.sender] == Role.Admin, "Only admin can perform this action");
        _;
    }

    // 角色权限管理：教师权限
    modifier onlyTeacher() {
        require(userRoles[msg.sender] == Role.Teacher, "Only teacher can perform this action");
        _;
    }

    // 角色权限管理：学生权限
    modifier onlyStudent() {
        require(userRoles[msg.sender] == Role.Student, "Only student can perform this action");
        _;
    }

    // 角色权限管理：成绩管理员权限
    modifier onlyGradeManager() {
        require(userRoles[msg.sender] == Role.GradeManager, "Only grade manager can perform this action");
        _;
    }

    // 修饰符：确保调用者不是管理员
    modifier notAdmin() {
        require(userRoles[msg.sender] != Role.Admin, "Admins cannot register");
        _;
    }

    // 部署合约时设置管理员为合约创建者
    constructor() {
        admin = msg.sender;
        userRoles[admin] = Role.Admin;  // 默认创建者为管理员
    }

    // 管理员可以为用户分配角色
    function assignRole(address _user, Role _role) external onlyAdmin {
        userRoles[_user] = _role;
        emit RoleAssigned(_user, _role);
    }

    // 管理员可以添加教师
    function addTeacher(address _teacher) external onlyAdmin {
        userRoles[_teacher] = Role.Teacher;
        emit RoleAssigned(_teacher, Role.Teacher);
    }

    // 管理员可以移除教师
    function removeTeacher(address _teacher) external onlyAdmin {
        userRoles[_teacher] = Role.Student;  // 可将其角色重置为学生或其他角色
        emit RoleAssigned(_teacher, Role.Student);
    }

    // 注册用户并设置其基本信息
    function registerUser(string calldata username, string calldata email, string calldata contactNumber) external notAdmin {
        users[msg.sender] = User({
            username: username,
            email: email,
            contactNumber: contactNumber,
            role: userRoles[msg.sender]  // 用户注册时的角色
        });

        userList.push(msg.sender); // 记录用户地址
        emit UserRegistered(msg.sender, username, email, contactNumber);
    }

    // 教师上传成绩
    function uploadGrade(
        string calldata gradeId,
        string calldata studentId,
        string calldata course,
        uint8 score,
        string calldata remark
    ) external onlyTeacher {
        require(score <= 100, "Invalid score");

        Grade memory newGrade = Grade({
            gradeId: gradeId,
            studentId: studentId,
            course: course,
            score: score,
            timestamp: block.timestamp,
            teacher: msg.sender,
            status: "active",  // 初始状态为有效
            remark: remark
        });

        studentGrades[studentId].push(newGrade);
        emit GradeUploaded(gradeId, studentId, course, score, msg.sender);
    }

    // 管理员更新成绩状态（有效/无效）
    function updateGradeStatus(string calldata studentId, uint index, string calldata newStatus) external onlyAdmin {
        require(index < studentGrades[studentId].length, "Invalid index");
        studentGrades[studentId][index].status = newStatus;
        emit GradeStatusUpdated(studentGrades[studentId][index].gradeId, newStatus);
    }

    // 学生查询自己的成绩
    function getGrades(string calldata studentId) external view onlyStudent returns (Grade[] memory) {
        return studentGrades[studentId];
    }

    // 查询用户信息
    function getUserInfo(address _user) external view returns (User memory) {
        return users[_user];
    }

    // 查询某个地址的角色
    function getUserRole(address _user) external view returns (Role) {
        return userRoles[_user];
    }

    // 查询管理员
    function isAdmin() external view returns (bool) {
        return userRoles[msg.sender] == Role.Admin;
    }

    // 查询教师权限
    function isTeacher() external view returns (bool) {
        return userRoles[msg.sender] == Role.Teacher;
    }

    // 查询学生权限
    function isStudent() external view returns (bool) {
        return userRoles[msg.sender] == Role.Student;
    }

    // 查询成绩管理员权限
    function isGradeManager() external view returns (bool) {
        return userRoles[msg.sender] == Role.GradeManager;
    }

    // 成绩管理员查询某个学生的所有成绩
    function getAllGradesForStudent(string calldata studentId) external view onlyGradeManager returns (Grade[] memory) {
        return studentGrades[studentId];
    }

    // 管理员查询所有用户地址
    function getAllUsers() external view onlyAdmin returns (address[] memory) {
        return userList;
    }
}
