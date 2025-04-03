// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.20;

contract EducationGrades {
    enum Role { Admin, Teacher, Student, GradeManager }

    struct Grade {
        uint gradeId; // 将gradeId改为uint类型，使用自增ID
        string studentId;
        string course;
        uint8 score;
        uint256 timestamp;
        address teacher;
        string status;  // 状态 "approved"、"pending" 或 "rejected"
        string remark;
    }

    struct User {
        string username;
        string email;
        string contactNumber;
        Role role;
        bool isRegistered;
    }

    address public admin;
    mapping(address => User) public users;
    mapping(address => Role) public userRoles;
    mapping(string => Grade[]) private studentGradesById;
    mapping(string => Grade[]) private studentGradesByUsername;
    mapping(address => Grade[]) private studentGradesByAddress;
    mapping(address => Grade[]) private teacherGrades;
    address[] private userList;

    uint private gradeIdCounter = 0; // 自增ID计数器

    event GradeUploaded(uint indexed gradeId, string studentId, string course, uint8 score, address teacher);
    event GradeStatusUpdated(uint indexed gradeId, string newStatus);
    event GradeApproved(uint indexed gradeId, address approvedBy);
    event RoleAssigned(address indexed user, Role role);
    event UserRegistered(address indexed user, string username, string email, string contactNumber);
    event UserRemoved(address indexed user);

    modifier onlyAdmin() {
        require(userRoles[msg.sender] == Role.Admin, "Only admin can perform this action");
        _;
    }

    modifier onlyTeacher() {
        require(userRoles[msg.sender] == Role.Teacher, "Only teacher can perform this action");
        _;
    }

    modifier onlyStudent() {
        require(userRoles[msg.sender] == Role.Student, "Only student can perform this action");
        _;
    }

    modifier onlyGradeManager() {
        require(userRoles[msg.sender] == Role.GradeManager, "Only grade manager can perform this action");
        _;
    }

    modifier notAdmin() {
        require(userRoles[msg.sender] != Role.Admin, "Admins cannot register");
        _;
    }

    constructor() {
        admin = msg.sender;
        userRoles[admin] = Role.Admin;
    }

    function assignRole(address _user, Role _role) external onlyAdmin {
        userRoles[_user] = _role;
        users[_user].role = _role;
        emit RoleAssigned(_user, _role);
    }

    function addTeacher(address _teacher) external onlyAdmin {
        userRoles[_teacher] = Role.Teacher;
        users[_teacher].role = Role.Teacher;
        emit RoleAssigned(_teacher, Role.Teacher);
    }

    function removeTeacher(address _teacher) external onlyAdmin {
        userRoles[_teacher] = Role.Student;
        users[_teacher].role = Role.Student;
        emit RoleAssigned(_teacher, Role.Student);
    }

    function registerUser(string calldata username, string calldata email, string calldata contactNumber) external notAdmin {
        require(!users[msg.sender].isRegistered, "This address is already registered.");
        
        users[msg.sender] = User({
            username: username,
            email: email,
            contactNumber: contactNumber,
            role: Role.Student,
            isRegistered: true
        });

        userList.push(msg.sender);
        emit UserRegistered(msg.sender, username, email, contactNumber);
    }

    // 修改上传成绩逻辑，默认状态为 "approved"
    function uploadGrade(
        string calldata studentId,
        string calldata course,
        uint8 score,
        string calldata remark,
        address studentAddress
    ) external onlyTeacher {
        require(score <= 100, "Invalid score");

        // Ensure student is registered
        require(users[studentAddress].isRegistered, "Student is not registered");

        // 自增ID
        uint gradeId = gradeIdCounter;
        gradeIdCounter++;

        Grade memory newGrade = Grade({
            gradeId: gradeId,
            studentId: studentId,
            course: course,
            score: score,
            timestamp: block.timestamp,
            teacher: msg.sender,
            status: "approved",  // 默认上传成绩为通过
            remark: remark
        });

        // Store grade by student address
        studentGradesById[studentId].push(newGrade);
        studentGradesByUsername[users[studentAddress].username].push(newGrade);
        studentGradesByAddress[studentAddress].push(newGrade);
        teacherGrades[msg.sender].push(newGrade);

        emit GradeUploaded(gradeId, studentId, course, score, msg.sender);
    }

    // 修改成绩状态为 "rejected" 的新函数
    function setGradeToRejected(uint gradeId) external onlyAdmin {
        bool updated = false;
        for (uint i = 0; i < userList.length; i++) {
            address studentAddress = userList[i];
            string memory studentId = users[studentAddress].username;
            Grade[] storage grades = studentGradesById[studentId];
            for (uint j = 0; j < grades.length; j++) {
                if (grades[j].gradeId == gradeId) {
                    // 设置不通过的条件：成绩低于60分
                    if (grades[j].score < 60) {
                        grades[j].status = "rejected";
                        updated = true;
                        emit GradeStatusUpdated(gradeId, "rejected");
                    }
                    break;
                }
            }
            if (updated) break;
        }
        require(updated, "Grade not found or doesn't meet rejection criteria");
    }

    function updateGradeStatus(uint gradeId, string calldata newStatus) external onlyAdmin {
        bool updated = false;
        for (uint i = 0; i < userList.length; i++) {
            address studentAddress = userList[i];
            string memory studentId = users[studentAddress].username;
            Grade[] storage grades = studentGradesById[studentId];
            for (uint j = 0; j < grades.length; j++) {
                if (grades[j].gradeId == gradeId) {
                    grades[j].status = newStatus;
                    updated = true;
                    emit GradeStatusUpdated(gradeId, newStatus);
                    break;
                }
            }
            if (updated) break;
        }
        require(updated, "Grade not found");
    }

    function approveGrade(uint gradeId) external onlyAdmin {
        bool approved = false;
        for (uint i = 0; i < userList.length; i++) {
            address studentAddress = userList[i];
            string memory studentId = users[studentAddress].username;
            Grade[] storage grades = studentGradesById[studentId];
            for (uint j = 0; j < grades.length; j++) {
                if (grades[j].gradeId == gradeId) {
                    grades[j].status = "approved";
                    approved = true;
                    emit GradeApproved(gradeId, msg.sender);
                    break;
                }
            }
            if (approved) break;
        }
        require(approved, "Grade not found");
    }

    function getGradesByStudentId(string calldata studentId) external view returns (Grade[] memory) {
        return studentGradesById[studentId];
    }

    function getGradesByUsername(string calldata username) external view returns (Grade[] memory) {
        return studentGradesByUsername[username];
    }

    function getGradesByAddress(address studentAddress) external view returns (Grade[] memory) {
        return studentGradesByAddress[studentAddress];
    }

    function getLowScoreGrades() external view returns (Grade[] memory) {
        uint count = 0;
        // 遍历所有学生成绩并计数低于60分的成绩
        for (uint i = 0; i < userList.length; i++) {
            address studentAddress = userList[i];
            string memory studentId = users[studentAddress].username;
            Grade[] storage grades = studentGradesById[studentId];
            for (uint j = 0; j < grades.length; j++) {
                if (grades[j].score < 60) {
                    count++;
                }
            }
        }

        Grade[] memory lowScoreGrades = new Grade[](count);
        uint index = 0;
        for (uint i = 0; i < userList.length; i++) {
            address studentAddress = userList[i];
            string memory studentId = users[studentAddress].username;
            Grade[] storage grades = studentGradesById[studentId];
            for (uint j = 0; j < grades.length; j++) {
                if (grades[j].score < 60) {
                    lowScoreGrades[index] = grades[j];
                    index++;
                }
            }
        }

        return lowScoreGrades;
    }

    function getUserInfo(address _user) external view returns (User memory) {
        return users[_user];
    }

    function getUserRole(address _user) external view returns (Role) {
        return userRoles[_user];
    }

    function isAdmin() external view returns (bool) {
        return userRoles[msg.sender] == Role.Admin;
    }

    function isTeacher() external view returns (bool) {
        return userRoles[msg.sender] == Role.Teacher;
    }

    function isStudent() external view returns (bool) {
        return userRoles[msg.sender] == Role.Student;
    }

    function isGradeManager() external view returns (bool) {
        return userRoles[msg.sender] == Role.GradeManager;
    }

    function getAllUsers() external view onlyAdmin returns (address[] memory) {
        return userList;
    }

    function removeUser(address _user) external onlyAdmin {
        require(users[_user].isRegistered, "User is not registered.");
        delete studentGradesById[users[_user].username];
        delete studentGradesByUsername[users[_user].username];
        delete studentGradesByAddress[_user];
        delete teacherGrades[_user];
        delete users[_user];
        emit UserRemoved(_user);
    }
}
