// SPDX-License-Identifier: MIT
// 指定合约的许可证为 MIT

pragma solidity ^0.8.20;
// 指定使用的 Solidity 编译器版本

contract EducationGrades {
    // 枚举定义用户的角色：管理员、教师、学生、成绩管理员
    enum Role { Admin, Teacher, Student, GradeManager }

    // 成绩结构体，包含成绩基本信息
    struct Grade {
        uint gradeId;            // 成绩ID（唯一标识）
        string studentId;        // 学生ID（学号）
        string course;           // 课程名称
        uint8 score;             // 分数（0~100）
        uint256 timestamp;       // 上传时间戳
        address teacher;         // 评分教师的地址
        string status;           // 成绩状态（如 approved、rejected）
        string remark;           // 教师对成绩的备注
    }

    // 用户结构体，包含注册信息和角色
    struct User {
        string username;         // 用户名（学号）
        string email;            // 邮箱
        string contactNumber;    // 联系方式
        Role role;               // 用户角色
        bool isRegistered;       // 注册标记
    }

    address public admin; // 系统管理员地址

    // 主要映射关系
    mapping(address => User) public users;                     // 地址 => 用户信息
    mapping(address => Role) public userRoles;                 // 地址 => 角色
    mapping(string => address) private studentIdToAddress;     // 学号 => 地址
    mapping(address => string) private addressToStudentId;     // 地址 => 学号

    // 热映射成绩数据
    mapping(string => Grade[]) private studentGradesById;       // 按 studentId 查询成绩
    mapping(string => Grade[]) private studentGradesByUsername; // 按用户名（学号）查询
    mapping(address => Grade[]) private studentGradesByAddress; // 按地址查询
    mapping(address => Grade[]) private teacherGrades;          // 教师上传的成绩
    address[] private userList;                                 // 所有注册用户列表

    uint private gradeIdCounter = 0; // 成绩 ID 自增计数器

    // 各类事件定义，便利链上日志记录与前端监听
    event GradeUploaded(uint indexed gradeId, string studentId, string course, uint8 score, address teacher);
    event GradeStatusUpdated(uint indexed gradeId, string newStatus);
    event GradeApproved(uint indexed gradeId, address approvedBy);
    event RoleAssigned(address indexed user, Role role);
    event UserRegistered(address indexed user, string username, string email, string contactNumber);
    event UserRemoved(address indexed user);

    // 角色控制的修饰器，确保只有管理员能执行某些操作
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

    // 构造函数，部署合约时自动将部署者设置为管理员
    constructor() {
        admin = msg.sender; // 将合约创建者的地址设置为管理员
        userRoles[admin] = Role.Admin; // 给创建者角色属性赋值为管理员
    }

    // 管理员为用户分配角色
    function assignRole(address _user, Role _role) external onlyAdmin {
        userRoles[_user] = _role; // 更新用户角色
        users[_user].role = _role; // 更新用户信息中的角色
        emit RoleAssigned(_user, _role); // 触发角色分配事件
    }

    // 学生注册，绑定学号、邮箱、联系方式，角色初始设为学生
    function registerUser(
        string calldata studentId,
        string calldata email,
        string calldata contactNumber
    ) external notAdmin {
        // 校验：当前用户未注册
        require(!users[msg.sender].isRegistered, "Already registered");
        // 校验：学号未被使用
        require(studentIdToAddress[studentId] == address(0), "studentId already used");

        // 建立用户信息并保存
        users[msg.sender] = User({
            username: studentId,          // 将学号作为用户名
            email: email,                 // 保存用户邮箱
            contactNumber: contactNumber, // 保存联系人电话
            role: Role.Student,           // 设置默认角色为学生
            isRegistered: true            // 标记为已注册
        });

        // 将学号与用户地址进行关联
        studentIdToAddress[studentId] = msg.sender;
        // 将用户地址与学号进行关联
        addressToStudentId[msg.sender] = studentId;
        // 将用户的地址加入用户列表
        userList.push(msg.sender);

        emit UserRegistered(msg.sender, studentId, email, contactNumber); // 触发用户注册事件
    }

    // 教师上传学生成绩的函数
    function uploadGrade(
        string calldata studentId,
        string calldata course,
        uint8 score,
        string calldata remark
    ) external onlyTeacher {
        // 校验：分数在有效范围内（0-100）
        require(score <= 100, "Invalid score");

        // 查找学生地址
        address studentAddress = studentIdToAddress[studentId];
        // 校验：学生地址存在
        require(studentAddress != address(0), "Student not found");

        // 创建新成绩记录 ID
        uint gradeId = gradeIdCounter++;
        // 创建成绩结构体实例并初始化
        Grade memory newGrade = Grade({
            gradeId: gradeId,                    // 成绩ID
            studentId: studentId,                // 学生ID
            course: course,                       // 课程名称
            score: score,                         // 分数
            timestamp: block.timestamp,           // 当前区块时间戳
            teacher: msg.sender,                  // 上传成绩的教师地址
            status: "approved",                   // 成绩初始状态为已批准
            remark: remark                        // 教师备注
        });

        // 将成绩记录存储到多个映射中，便于通过不同的索引查询
        studentGradesById[studentId].push(newGrade);
        studentGradesByUsername[users[studentAddress].username].push(newGrade);
        studentGradesByAddress[studentAddress].push(newGrade);
        teacherGrades[msg.sender].push(newGrade);

        emit GradeUploaded(gradeId, studentId, course, score, msg.sender); // 触发成绩上传事件
    }

    // 管理员将某个不及格成绩的状态更改为 rejected
    function setGradeToRejected(uint gradeId) external onlyAdmin {
        bool updated = false; // 状态标记，是否已更新

        // 遍历用户列表
        for (uint i = 0; i < userList.length; i++) {
            address studentAddress = userList[i]; // 获取学生地址
            string memory studentId = addressToStudentId[studentAddress]; // 获取学生ID
            Grade[] storage grades = studentGradesById[studentId]; // 获取该学生的成绩列表

            // 遍历成绩，检查不及格（<60）的成绩
            for (uint j = 0; j < grades.length; j++) {
                if (grades[j].gradeId == gradeId && grades[j].score < 60) {
                    grades[j].status = "rejected"; // 更新成绩状态为被拒绝
                    updated = true; // 标记为已更新
                    emit GradeStatusUpdated(gradeId, "rejected"); // 触发状态更新事件
                    break;
                }
            }
            // 如果更新成功，则跳出循环
            if (updated) break;
        }
        require(updated, "Grade not found or not eligible"); // 校验：未找到成绩或不合格
    }

    // 管理员更新成绩的状态为新的状态
    function updateGradeStatus(uint gradeId, string calldata newStatus) external onlyAdmin {
        bool updated = false; // 状态标记，是否已更新

        // 遍历用户列表
        for (uint i = 0; i < userList.length; i++) {
            address studentAddress = userList[i]; // 获取学生地址
            string memory studentId = addressToStudentId[studentAddress]; // 获取学生ID
            Grade[] storage grades = studentGradesById[studentId]; // 获取该学生的成绩列表

            // 遍历成绩，查找匹配的成绩ID
            for (uint j = 0; j < grades.length; j++) {
                if (grades[j].gradeId == gradeId) {
                    grades[j].status = newStatus; // 更新成绩状态为新的状态
                    updated = true; // 标记为已更新
                    emit GradeStatusUpdated(gradeId, newStatus); // 触发状态更新事件
                    break;
                }
            }
            // 如果更新成功，则跳出循环
            if (updated) break;
        }
        require(updated, "Grade not found"); // 校验：未找到成绩
    }

    // 管理员批准成绩，设置为“已批准”状态
    function approveGrade(uint gradeId) external onlyAdmin {
        bool approved = false; // 状态标记，是否已批准

        // 遍历用户列表
        for (uint i = 0; i < userList.length; i++) {
            address studentAddress = userList[i]; // 获取学生地址
            string memory studentId = addressToStudentId[studentAddress]; // 获取学生ID
            Grade[] storage grades = studentGradesById[studentId]; // 获取该学生的成绩列表

            // 遍历成绩，查找匹配的成绩ID
            for (uint j = 0; j < grades.length; j++) {
                if (grades[j].gradeId == gradeId) {
                    grades[j].status = "approved"; // 更新成绩状态为已批准
                    approved = true; // 标记为已批准
                    emit GradeApproved(gradeId, msg.sender); // 触发成绩批准事件
                    break;
                }
            }
            // 如果批准成功，则跳出循环
            if (approved) break;
        }
        require(approved, "Grade not found"); // 校验：未找到成绩
    }

    // 按学号查询成绩列表
    function getGradesByStudentId(string calldata studentId) external view returns (Grade[] memory) {
        return studentGradesById[studentId]; // 返回该学号对应的成绩数组
    }

    // 按用户名（学号）查询成绩列表
    function getGradesByUsername(string calldata username) external view returns (Grade[] memory) {
        return studentGradesByUsername[username]; // 返回该用户名对应的成绩数组
    }

    // 按地址查询成绩列表
    function getGradesByAddress(address studentAddress) external view returns (Grade[] memory) {
        return studentGradesByAddress[studentAddress]; // 返回该地址对应的成绩数组
    }

    // 获取所有不及格（<60分）的成绩
    function getLowScoreGrades() external view returns (Grade[] memory) {
        uint count = 0; // 统计不及格成绩的数量

        // 第一次遍历计算不及格成绩的总数（为后续数组分配大小）
        for (uint i = 0; i < userList.length; i++) {
            address studentAddress = userList[i]; // 获取学生地址
            string memory studentId = addressToStudentId[studentAddress]; // 获取学生ID
            Grade[] storage grades = studentGradesById[studentId]; // 获取该学生的成绩列表
            for (uint j = 0; j < grades.length; j++) {
                if (grades[j].score < 60) count++; // 统计不及格成绩
            }
        }

        // 创建存放不及格成绩的数组
        Grade[] memory lowGrades = new Grade[](count);
        uint index = 0; // 不及格成绩数组的索引

        // 第二次遍历填充不及格成绩数组
        for (uint i = 0; i < userList.length; i++) {
            address studentAddress = userList[i]; // 获取学生地址
            string memory studentId = addressToStudentId[studentAddress]; // 获取学生ID
            Grade[] storage grades = studentGradesById[studentId]; // 获取该学生的成绩列表
            for (uint j = 0; j < grades.length; j++) {
                if (grades[j].score < 60) {
                    lowGrades[index++] = grades[j]; // 将不及格成绩添加到数组中
                }
            }
        }
        return lowGrades; // 返回不及格成绩数组
    }

    // 获取某个用户的注册信息
    function getUserInfo(address _user) external view returns (User memory) {
        return users[_user]; // 返回该用户的信息
    }

    // 获取某个地址的角色
    function getUserRole(address _user) external view returns (Role) {
        return userRoles[_user]; // 返回该用户的角色
    }

    // 管理员获取所有注册用户地址列表
    function getAllUsers() external view onlyAdmin returns (address[] memory) {
        return userList; // 返回所有注册用户的地址列表
    }

    // 管理员删除某个用户，清除其所有关联数据
    function removeUser(address _user) external onlyAdmin {
        require(users[_user].isRegistered, "User not registered"); // 校验用户是否注册
        string memory studentId = addressToStudentId[_user]; // 获取该用户的学号

        // 从各个映射中删除用户的相关信息
        delete studentIdToAddress[studentId]; // 删除学号与地址的映射
        delete addressToStudentId[_user]; // 删除地址与学号的映射
        delete studentGradesById[studentId]; // 删除学号对应的成绩记录
        delete studentGradesByUsername[studentId]; // 删除用户名（学号）对应的成绩记录
        delete studentGradesByAddress[_user]; // 删除地址对应的成绩记录
        delete teacherGrades[_user]; // 删除教师地址对应的成绩记录
        delete users[_user]; // 删除用户信息

        emit UserRemoved(_user); // 触发用户移除事件
    }
}
