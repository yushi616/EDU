// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EducationGrades {
    enum Role { Admin, Teacher, Student, GradeManager }

    struct Grade {
        uint gradeId;
        string studentId;
        string course;
        uint8 score;
        uint256 timestamp;
        address teacher;
        string status;
        string remark;
    }

    struct User {
        string username; // 即 studentId
        string email;
        string contactNumber;
        Role role;
        bool isRegistered;
    }

    address public admin;
    mapping(address => User) public users;
    mapping(address => Role) public userRoles;
    mapping(string => address) private studentIdToAddress; // studentId → address
    mapping(address => string) private addressToStudentId; // address → studentId

    mapping(string => Grade[]) private studentGradesById;
    mapping(string => Grade[]) private studentGradesByUsername;
    mapping(address => Grade[]) private studentGradesByAddress;
    mapping(address => Grade[]) private teacherGrades;
    address[] private userList;

    uint private gradeIdCounter = 0;

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

    function registerUser(
        string calldata studentId,
        string calldata email,
        string calldata contactNumber
    ) external notAdmin {
        require(!users[msg.sender].isRegistered, "Already registered");
        require(studentIdToAddress[studentId] == address(0), "studentId already used");

        users[msg.sender] = User({
            username: studentId,
            email: email,
            contactNumber: contactNumber,
            role: Role.Student,
            isRegistered: true
        });

        studentIdToAddress[studentId] = msg.sender;
        addressToStudentId[msg.sender] = studentId;
        userList.push(msg.sender);

        emit UserRegistered(msg.sender, studentId, email, contactNumber);
    }

    function uploadGrade(
        string calldata studentId,
        string calldata course,
        uint8 score,
        string calldata remark
    ) external onlyTeacher {
        require(score <= 100, "Invalid score");

        address studentAddress = studentIdToAddress[studentId];
        require(studentAddress != address(0), "Student not found");

        uint gradeId = gradeIdCounter++;
        Grade memory newGrade = Grade({
            gradeId: gradeId,
            studentId: studentId,
            course: course,
            score: score,
            timestamp: block.timestamp,
            teacher: msg.sender,
            status: "approved",
            remark: remark
        });

        studentGradesById[studentId].push(newGrade);
        studentGradesByUsername[users[studentAddress].username].push(newGrade);
        studentGradesByAddress[studentAddress].push(newGrade);
        teacherGrades[msg.sender].push(newGrade);

        emit GradeUploaded(gradeId, studentId, course, score, msg.sender);
    }

    function setGradeToRejected(uint gradeId) external onlyAdmin {
        bool updated = false;
        for (uint i = 0; i < userList.length; i++) {
            address studentAddress = userList[i];
            string memory studentId = addressToStudentId[studentAddress];
            Grade[] storage grades = studentGradesById[studentId];
            for (uint j = 0; j < grades.length; j++) {
                if (grades[j].gradeId == gradeId && grades[j].score < 60) {
                    grades[j].status = "rejected";
                    updated = true;
                    emit GradeStatusUpdated(gradeId, "rejected");
                    break;
                }
            }
            if (updated) break;
        }
        require(updated, "Grade not found or not eligible");
    }

    function updateGradeStatus(uint gradeId, string calldata newStatus) external onlyAdmin {
        bool updated = false;
        for (uint i = 0; i < userList.length; i++) {
            address studentAddress = userList[i];
            string memory studentId = addressToStudentId[studentAddress];
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
            string memory studentId = addressToStudentId[studentAddress];
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
        for (uint i = 0; i < userList.length; i++) {
            address studentAddress = userList[i];
            string memory studentId = addressToStudentId[studentAddress];
            Grade[] storage grades = studentGradesById[studentId];
            for (uint j = 0; j < grades.length; j++) {
                if (grades[j].score < 60) count++;
            }
        }

        Grade[] memory lowGrades = new Grade[](count);
        uint index = 0;
        for (uint i = 0; i < userList.length; i++) {
            address studentAddress = userList[i];
            string memory studentId = addressToStudentId[studentAddress];
            Grade[] storage grades = studentGradesById[studentId];
            for (uint j = 0; j < grades.length; j++) {
                if (grades[j].score < 60) {
                    lowGrades[index++] = grades[j];
                }
            }
        }
        return lowGrades;
    }

    function getUserInfo(address _user) external view returns (User memory) {
        return users[_user];
    }

    function getUserRole(address _user) external view returns (Role) {
        return userRoles[_user];
    }

    function getAllUsers() external view onlyAdmin returns (address[] memory) {
        return userList;
    }

    function removeUser(address _user) external onlyAdmin {
        require(users[_user].isRegistered, "User not registered");
        string memory studentId = addressToStudentId[_user];
        delete studentIdToAddress[studentId];
        delete addressToStudentId[_user];
        delete studentGradesById[studentId];
        delete studentGradesByUsername[studentId];
        delete studentGradesByAddress[_user];
        delete teacherGrades[_user];
        delete users[_user];
        emit UserRemoved(_user);
    }
}
