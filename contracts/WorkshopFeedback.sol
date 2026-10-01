// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title WorkshopFeedback
/// @notice Collects structured workshop/course feedback on-chain.
///         Each wallet can submit one feedback per course.
contract WorkshopFeedback {
    // --------------------------------------------------------------------
    // Types
    // --------------------------------------------------------------------

    /// @dev Order of the 30 rating items (each 1..5):
    ///  [0]      Level of effort put in by the instructor
    ///  [1]      Learning experience so far
    ///  [2..6]   Discipline (5 items)
    ///  [7..13]  Teaching skill (7 items)
    ///  [14..23] Communication (10 items, 1 = Strongly Disagree .. 5 = Strongly Agree)
    ///  [24..29] Outcomes (6 items)
    uint8 public constant RATING_COUNT = 30;

    uint256 public constant MAX_NAME_LENGTH = 64; // bytes
    uint256 public constant MAX_TEXT_LENGTH = 1000; // bytes

    enum Reason {
        OfficialRequirement,
        FitsMySchedule,
        PersonalInterest
    }

    enum Recommend {
        Yes,
        No,
        Maybe
    }

    struct Course {
        string name;
        bool active;
    }

    struct Feedback {
        address submitter;
        uint64 timestamp;
        uint32 courseId;
        Reason reason;
        Recommend recommend;
        bool wouldPay;
        uint8[30] ratings;
        string name; // optional
        string mostUseful;
        string improvements;
        string complaints;
    }

    struct FeedbackInput {
        uint32 courseId;
        string name;
        uint8[30] ratings;
        string mostUseful;
        string improvements;
        string complaints;
        Reason reason;
        Recommend recommend;
        bool wouldPay;
    }

    // --------------------------------------------------------------------
    // Storage
    // --------------------------------------------------------------------

    address public owner;
    Course[] private _courses;
    Feedback[] private _feedbacks;

    /// courseId => wallet => submitted?
    mapping(uint256 => mapping(address => bool)) public hasSubmitted;

    // --------------------------------------------------------------------
    // Events & errors
    // --------------------------------------------------------------------

    event CourseAdded(uint256 indexed courseId, string name);
    event CourseStatusChanged(uint256 indexed courseId, bool active);
    event FeedbackSubmitted(uint256 indexed feedbackId, uint256 indexed courseId, address indexed submitter);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error InvalidCourse();
    error CourseInactive();
    error AlreadySubmitted();
    error InvalidRating(uint256 index, uint8 value);
    error TextTooLong();
    error ZeroAddress();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(string[] memory initialCourses) {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
        for (uint256 i = 0; i < initialCourses.length; i++) {
            _addCourse(initialCourses[i]);
        }
    }

    // --------------------------------------------------------------------
    // Participant
    // --------------------------------------------------------------------

    function submitFeedback(FeedbackInput calldata input) external returns (uint256 feedbackId) {
        if (input.courseId >= _courses.length) revert InvalidCourse();
        if (!_courses[input.courseId].active) revert CourseInactive();
        if (hasSubmitted[input.courseId][msg.sender]) revert AlreadySubmitted();

        for (uint256 i = 0; i < RATING_COUNT; i++) {
            uint8 r = input.ratings[i];
            if (r < 1 || r > 5) revert InvalidRating(i, r);
        }

        if (
            bytes(input.name).length > MAX_NAME_LENGTH || bytes(input.mostUseful).length > MAX_TEXT_LENGTH
                || bytes(input.improvements).length > MAX_TEXT_LENGTH || bytes(input.complaints).length > MAX_TEXT_LENGTH
        ) revert TextTooLong();

        hasSubmitted[input.courseId][msg.sender] = true;

        feedbackId = _feedbacks.length;
        _feedbacks.push(
            Feedback({
                submitter: msg.sender,
                timestamp: uint64(block.timestamp),
                courseId: input.courseId,
                reason: input.reason,
                recommend: input.recommend,
                wouldPay: input.wouldPay,
                ratings: input.ratings,
                name: input.name,
                mostUseful: input.mostUseful,
                improvements: input.improvements,
                complaints: input.complaints
            })
        );

        emit FeedbackSubmitted(feedbackId, input.courseId, msg.sender);
    }

    // --------------------------------------------------------------------
    // Views
    // --------------------------------------------------------------------

    function getCourses() external view returns (Course[] memory) {
        return _courses;
    }

    function courseCount() external view returns (uint256) {
        return _courses.length;
    }

    function feedbackCount() external view returns (uint256) {
        return _feedbacks.length;
    }

    function getFeedback(uint256 feedbackId) external view returns (Feedback memory) {
        return _feedbacks[feedbackId];
    }

    /// @notice Paginated read of all feedback (for dashboards / exports).
    function getFeedbacks(uint256 offset, uint256 limit) external view returns (Feedback[] memory page) {
        uint256 total = _feedbacks.length;
        if (offset >= total) return new Feedback[](0);
        uint256 end = offset + limit > total ? total : offset + limit;
        page = new Feedback[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = _feedbacks[i];
        }
    }

    // --------------------------------------------------------------------
    // Admin
    // --------------------------------------------------------------------

    function addCourse(string calldata name) external onlyOwner returns (uint256) {
        return _addCourse(name);
    }

    function setCourseActive(uint256 courseId, bool active) external onlyOwner {
        if (courseId >= _courses.length) revert InvalidCourse();
        _courses[courseId].active = active;
        emit CourseStatusChanged(courseId, active);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function _addCourse(string memory name) internal returns (uint256 courseId) {
        if (bytes(name).length == 0 || bytes(name).length > MAX_NAME_LENGTH) revert TextTooLong();
        courseId = _courses.length;
        _courses.push(Course({name: name, active: true}));
        emit CourseAdded(courseId, name);
    }
}
