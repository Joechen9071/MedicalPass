pragma solidity >=0.4.22 <=0.6.0;
    contract MedicalPass{
        
          struct PatientInfo{
            string name;
            string Insurance;
            uint DOB;
            bool RequireVisit;
            string ApptDetail;
            bool UpdatedRecord;

        }
        
        struct lab{
            address patient;
            address source;
            string detail;
            bool UnresolvedRequest;
        }
        
        struct labRecorder{
            address patient;
            address labaddress;
            string LabResult;
            bool RecordedLabResult;
        }
        
        struct doctor{
            address patient;
        }
        
        struct reception{
            address patient;
        }
        
        struct record{
            uint type_of_record;
            bytes32 code;
            string detail;
        }
        
        address chairperson;
        
        enum Phase{Idle,VisitStart,VisitEnd,LabworkStart,Labworkend}
        
        // Events
        event VisitStart(address patient);
        event VisitEnd(address patient);
        event LabworkStart(address patient);
        event Labworkend(address patient);
        
        
        mapping(address => uint) public role; 
        mapping(address => PatientInfo) public ThePatientInfo;
        mapping(address => lab) Lab;
        mapping(address => labRecorder) LabRecorder;
        mapping(address => doctor) public Doctor;
        mapping(address => reception) public Reception;
        mapping(address => bytes32) HashedIdentity;
        mapping(address => uint) AcceptedLabRequest;
        mapping(address => uint) AcceptedLabResult;
        mapping(address => record) Records;
        mapping(address => Phase) individual_phase;


        //default hash code to hash the information
        bytes32 private passcode = 0x7465737400000000000000000000000000000000000000000000000000000000;
        
        
        modifier validPhase(address person,Phase reqPhase)
        {
            require(individual_phase[person] == reqPhase);
            _;
        }
        
        modifier onlyPatient{
            // patient: 1
            require(role[msg.sender] == 1);
            _;
        }
        
        modifier onlyDoctor{
            //doctor: 2
            require(role[msg.sender] == 2);
            _;
        }
        modifier onlyReception{
            //reception: 3
            require(role[msg.sender] == 3);
            _;
        }
        modifier onlyLab{
            //lab: 4
            require(role[msg.sender] == 4);
            _;
        }
        modifier onlyDoctorAndReception{
            require(role[msg.sender] == 3 || role[msg.sender] == 2);
            _;
        }
        modifier onlyDoctorAndPatient{
            require(role[msg.sender] == 3 || role[msg.sender] == 1);
            _;
        }
        
        constructor(uint identity) public{
            require(identity != 1);
            chairperson = msg.sender;
            role[msg.sender] = identity;
        }
        
         function changeState(address person,Phase x) public {
            individual_phase[person] = x;
        }
        
        function VerifyIdentity(bytes32 password) public view returns(bool confirmation){
            bytes32 hashedValue = hashMe(msg.sender,password);
            if (HashedIdentity[msg.sender] == hashedValue){
                return true;
            }
            return false;
        }
        function changePasscode(bytes32 password) public {
            require(VerifyIdentity(password) == true);
            passcode = password;
        }
        
         function hashMe( address value1, bytes32 password) private pure returns(bytes32 hashcode)
         {
        	bytes32 hashedValue = keccak256(abi.encodePacked(value1, password));
        	return hashedValue;
         }
         
         function hashDetail(string memory ApptDetail)private view returns (bytes32 hashedValue){
              bytes32 hash = keccak256(abi.encodePacked(ApptDetail, passcode));
              return hash;
         }
        
        
        function Register (uint identity, string memory name,string memory Insurance,uint DOB,bytes32 password) public payable{
            require(identity == 1 || identity == 2 || identity == 3 || identity == 4);
            address Personnel = msg.sender;
            role[Personnel] = identity;
            HashedIdentity[msg.sender] = hashMe(msg.sender,password);
            
            if(identity == 1){
                ThePatientInfo[msg.sender].name = name;
                ThePatientInfo[msg.sender].Insurance = Insurance;
                ThePatientInfo[msg.sender].DOB = DOB;
                ThePatientInfo[msg.sender].UpdatedRecord = true;
                individual_phase[msg.sender] = Phase.Idle;
            }
            
            if (identity == 2 || identity == 3){
                LabRecorder[msg.sender].RecordedLabResult = true;
            }
        }
        
        function RequestVisit(address patient) public payable {
            ThePatientInfo[patient].RequireVisit = true;
        }
        
        function CheckAssignedPatient(address patient) public view returns(bool){
            if (role[msg.sender] == 2){
                return Doctor[msg.sender].patient == patient;
            }
            if(role[msg.sender] == 3){
                return Reception[msg.sender].patient == patient;
            }
            if(role[msg.sender] == 4){
                return Lab[msg.sender].patient == patient;
            }
        }
        
        function SendAppointmentDetail(address patient,string memory Detail,uint type_record,bytes32 code) onlyDoctor public payable returns(string memory detail){
            if(ThePatientInfo[patient].UpdatedRecord == false){
                revert();
            }
            ThePatientInfo[patient].ApptDetail = Detail;
            ThePatientInfo[patient].UpdatedRecord = false;
            Records[patient].type_of_record = type_record;
            Records[patient].code = code;
            Records[patient].detail = Detail;
            
            individual_phase[patient] = Phase.VisitEnd;
            
            emit VisitEnd(patient);

            return Detail;
        }
        
        function RecordVisit(address patient, uint Date) onlyDoctorAndReception public validPhase(patient,Phase.Idle) returns(address PatientAddress, uint DateVisited){
            if (role[patient] != 1){
                revert();
            }
            if (ThePatientInfo[patient].UpdatedRecord == false){
                revert();
            }
            ThePatientInfo[patient].RequireVisit = false;
            
            individual_phase[patient] = Phase.VisitStart;
            
            emit VisitStart(patient);

            return (patient,Date);
        }
        
        function ViewPatientInfo(address patient,bytes32 password) public view returns(string memory name,string memory Insurance,uint DOB,bool update){
            require(VerifyIdentity(password) == true);
            if (role[patient] != 1){
                revert();
            }
            return (ThePatientInfo[patient].name,ThePatientInfo[patient].Insurance,ThePatientInfo[patient].DOB,ThePatientInfo[patient].UpdatedRecord);
        }
        
        function SendMedicalRecord(address destination, bytes32 password) onlyPatient public payable{
            require(VerifyIdentity(password) == true);
            if (role[destination]!= 2 && role[destination]!=3 && role[destination] != 4){
                revert();
            }
            
            if(role[destination] == 3){
                Lab[destination].patient = msg.sender;
                Lab[destination].detail = "Record Sent";
            }
            if(role[destination] == 4){
                Reception[destination].patient = msg.sender;
            }
            Doctor[destination].patient = msg.sender;
        }
        
        function UpdateRecord(bytes32 password) onlyPatient public validPhase(msg.sender,Phase.VisitEnd) returns(string memory detail) {
                require (VerifyIdentity(password) == true);
                string memory det = ThePatientInfo[msg.sender].ApptDetail;
                ThePatientInfo[msg.sender].UpdatedRecord = true;
                individual_phase[msg.sender] = Phase.Idle;
                return det;
        }
        
        function RequestLabWork(address labaddress,address patient,string memory labdetail,bytes32 password) onlyDoctorAndReception public payable validPhase(patient,Phase.VisitStart){
            require(VerifyIdentity(password) == true);
            if(role[labaddress] != 4){
                revert();
            }
            if(Lab[labaddress].UnresolvedRequest == true){
                revert();
            }
             Lab[labaddress].patient = patient;
             Lab[labaddress].source = msg.sender;
             Lab[labaddress].detail = labdetail;
             Lab[labaddress].UnresolvedRequest = true;
             
        }
        function AcceptLabRequest(bytes32 password,uint request_id) onlyLab public returns(Phase x,address patient_address, bytes32 source_address, bytes32 labdetail){
            Lab[msg.sender].UnresolvedRequest = false;
            
            bytes32 hashed_patient_add = hashMe(Lab[msg.sender].patient,password);
            
            bytes32 hashed_source_add = hashMe(Lab[msg.sender].source,password);
            
            bytes32 hashed_lab_request_detail = hashDetail(Lab[msg.sender].detail);
            
            AcceptedLabRequest[msg.sender] = request_id;
            
            individual_phase[Lab[msg.sender].patient] = Phase.LabworkStart;
            
            emit LabworkStart(Lab[msg.sender].patient);
            
            
            return (individual_phase[Lab[msg.sender].patient],Lab[msg.sender].patient,hashed_source_add,hashed_lab_request_detail);
        }
        
        function CheckLabStatus(bytes32 password) onlyDoctorAndReception public view returns(string memory result, address labaddress,address patient) {
            require(VerifyIdentity(password));

            return (LabRecorder[msg.sender].LabResult,LabRecorder[msg.sender].labaddress,LabRecorder[msg.sender].patient);
        }
        
        function SendLabResult(address receipt,address patient, string memory result) onlyLab public payable validPhase(patient,Phase.LabworkStart)  returns(Phase x,Phase y,address){
            if(LabRecorder[receipt].RecordedLabResult == false){
                revert();
            }
            
            if(role[receipt] > 4 || role[receipt] < 1){
                revert();
            }

            LabRecorder[receipt].patient = patient;
            LabRecorder[receipt].LabResult = result;
            LabRecorder[receipt].labaddress = msg.sender;
            LabRecorder[receipt].RecordedLabResult = false;
            
            individual_phase[patient] = Phase.Labworkend;
            
            emit Labworkend(patient);
            
            return (individual_phase[patient],Phase.Labworkend,patient);
            
        }
        function DeclineLabRequest() onlyLab public{
            // changes states
             Lab[msg.sender].UnresolvedRequest = false;
        }
        
        function AcceptLabResult(bytes32 password,uint result_id) onlyDoctorAndReception public validPhase(LabRecorder[msg.sender].patient,Phase.Labworkend) returns(address patient, address labaddress, bytes32 LabResult){
            require(VerifyIdentity(password) == true);
            
            LabRecorder[msg.sender].RecordedLabResult = true;
            
            bytes32 detail = hashDetail(LabRecorder[msg.sender].LabResult);
            
            //store accepted result with given id
            AcceptedLabResult[msg.sender] = result_id;
            
            
            
            return (LabRecorder[msg.sender].patient,LabRecorder[msg.sender].labaddress,detail);
        }
        
        function ViewLabRequestDetail(bytes32 password) onlyLab public view returns (address patient,string memory detail,address source){
            require(VerifyIdentity(password) == true);
            return (Lab[msg.sender].patient,Lab[msg.sender].detail,Lab[msg.sender].source);
        }
        
        function ViewMostRecentPatientRecord(address patient,bytes32 password)public view returns(uint record_type,bytes32 code,string memory detail){
            require(VerifyIdentity(password) ==  true);
            return (Records[patient].type_of_record,Records[patient].code,Records[patient].detail);
        }
    }