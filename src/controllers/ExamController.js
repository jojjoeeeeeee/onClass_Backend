const Users = require('../models/user_schema');
const Classes = require('../models/class_schema');
const Exams = require('../models/exam/examination_schema');
const ExamResults = require('../models/exam/exam_result_schema');
const Files = require('../models/file_schema');

const { arraysEqual } = require('../services/function');

const moment = require('moment');

const exam_status = ['ยังไม่ถึงช่วงสอบ','อยู่ในช่วงสอบ','ผ่านช่วงสอบไปแล้ว']

exports.get = async (req,res) => {

    const user_id = req.userId;
    const classcode = req.body.class_code;
    const exam_id = req.body.exam_id;

    if (!classcode||!exam_id) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const class_data = await Classes.findOne({ class_code: classcode });
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'You not in this class'});
        
        if (!class_data.class_exam_id.includes(exam_id)) return res.status(404).json({result: 'Not found', message: ''});

        const exam_data = await Exams.findById(exam_id);
        if (!exam_data) return res.status(404).json({result: 'Not found', message: ''});

        if(class_data.student_id.includes(user_id)) {
            //Validate time
            const now = moment()
            const start = moment(exam_data.exam_start_date);
            const end = moment(exam_data.exam_end_date);
            if (now.isBefore(start) || now.isAfter(end)) return res.status(200).json({result: 'nOK', message: 'Its not the time when you can take the exam'});

            //Already submit validate
            const examResultData = await ExamResults.findOne({ exam_id : exam_id});
            var already = false
            examResultData.student_result.map((examKey) => {
                if (examKey.student_id == user_id) return already = true
            });
            if (already) return res.status(200).json({result: 'nOK', message: 'You already submit this exam'});


            const res_part = []
            exam_data.part_list.map((key) => {
                const item = []
                key.item.map((value) => {
                    const q_details = {
                        question: value.question,
                        type: value.type,
                        image: value.image,
                        choice: value.choice
                    }
                    //ถ้าช้อยสามารถดึงข้อมูลจากในไฟล์ได้แสดงว่า ช้อยเป็นรูป
                    item.push(q_details)
                })
                const details = {
                    part_id: key.part_id,
                    type: key.type,
                    part_name: key.part_name,
                    part_description: key.part_description,
                    start_date: key.start_date,
                    end_date: key.end_date,
                    score: key.score,
                    item: item
                }
                res_part.push(details)
            });

            if (exam_data.optional_setting.random_question) {
                res_part.map((key) => {
                    var currentIndex = key.item.length, temporaryValue, randomIndex;

                    const defaultArr = key.item.map(i => {
                        return i
                    })
                
                    while (0 !== currentIndex) {
                        randomIndex = Math.floor(Math.random() * currentIndex);
                        currentIndex -= 1;
                        temporaryValue = key.item[currentIndex];
                        key.item[currentIndex] = key.item[randomIndex];
                        key.item[randomIndex] = temporaryValue;
                    }

                    const indexArr = defaultArr.map(obj => {
                        return key.item.indexOf(obj)
                    })

                    key.question_default_index = indexArr
                    
                    return key
                });
            }

            if (exam_data.optional_setting.random_choice) {
                res_part.map((key) => {
                    key.item.map((k) => {
                        if (key.type == 'objective') {
                            var currentIndex = k.choice.length, temporaryValue, randomIndex;

                            const defaultArr = k.choice.map(i => {
                                return i
                            })
                        
                            while (0 !== currentIndex) {
                                randomIndex = Math.floor(Math.random() * currentIndex);
                                currentIndex -= 1;
                                temporaryValue = k.choice[currentIndex];
                                k.choice[currentIndex] = k.choice[randomIndex];
                                k.choice[randomIndex] = temporaryValue;
                            }
        
                            const indexArr = defaultArr.map(obj => {
                                return k.choice.indexOf(obj)
                            })
        
                            k.choice_default_index = indexArr
                            return k
                        }
                        else {
                            return k
                        }
                    });
                    
                    return key
                });
            }

            const file_id = exam_data.exam_optional_file.map(key => {
                return key
            })
    
            const file_arr = []
            for(let i = 0; i < file_id.length; i++){
                const file_data = await Files.findById(file_id[i]);
                if(!file_data) return res.status(404).json({result: 'Not found', message: ''});
                const file_obj = {
                    file_name: file_data.file_name,
                    file_extension: file_data.filename_extension,
                    file_path: `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/file/download/${file_data._id}`
                }
                file_arr.push(file_obj)
            }

            const res_exam_data = {
                id:exam_data._id,
                optional_setting: [exam_data.optional_setting],
                exam_name: exam_data.exam_name,
                exam_description: exam_data.exam_description,
                author: exam_data.author,
                part_list: res_part,
                exam_optional_file: file_arr,
                exam_start_date: exam_data.exam_start_date,
                exam_end_date: exam_data.exam_end_date
            }

            res.status(200).json({result: 'OK', message: '', data: [res_exam_data]});
        }
        else {

            const file_id = exam_data.exam_optional_file.map(key => {
                return key
            })
    
            const file_arr = []
            for(let i = 0; i < file_id.length; i++){
                const file_data = await Files.findById(file_id[i]);
                if(!file_data) return res.status(404).json({result: 'Not found', message: ''});
                const file_obj = {
                    file_name: file_data.file_name,
                    file_extension: file_data.filename_extension,
                    file_path: `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/file/download/${file_data._id}`
                }
                file_arr.push(file_obj)
            }

            const res_exam_data = {
                id:exam_data._id,
                optional_setting: [exam_data.optional_setting],
                exam_name: exam_data.exam_name,
                exam_description: exam_data.exam_description,
                author: exam_data.author,
                part_list: exam_data.part_list,
                exam_optional_file: file_arr,
                exam_start_date: exam_data.exam_start_date,
                exam_end_date: exam_data.exam_end_date
            }
            res.status(200).json({result: 'OK', message: '', data: [res_exam_data]});
        }
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
    
};

exports.getAll = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    if (!classcode) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const class_data = await Classes.findOne({ class_code: classcode });
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id) && !class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'You not in this class'});

        const exam_data = []
        if (class_data.student_id.includes(user_id)) {
            for(let i = 0; i < class_data.class_exam_id.length; i++) {
                const query = await Exams.findById(class_data.class_exam_id[i]);
                var sum_score = 0

                for(let j = 0; j < query.part_list.length; j ++){

                    sum_score += Number(query.part_list[j].score);
                }


                //Exam period validate

                var status = ''

                const now = moment();
                const start = moment(query.exam_start_date);
                const end = moment(query.exam_end_date);

                if (now.isBefore(end) && now.isAfter(start)) {
                    status = exam_status[1]
                }
                else if (now.isBefore(start)) {
                    status = exam_status[0]
                }
                else if (now.isAfter(end)) {
                    status = exam_status[2]
                }

                const details = {
                    id: query._id,
                    exam_name: query.exam_name,
                    exam_description: query.exam_description,
                    score: sum_score,
                    exam_start_date: query.exam_start_date,
                    exam_end_date: query.exam_end_date,
                    created: moment(query.created),
                    status: status
                }
               
                exam_data.push(details);
            }
            const sorted_feed_data = exam_data.sort((a, b) => a.created.valueOf() - b.created.valueOf())
            res.status(200).json({result: 'OK', message: '', data: sorted_feed_data.reverse()});
        }
        else {
            for(let i = 0 ; i < class_data.class_exam_id.length ; i++) {
                const query = await Exams.findById(class_data.class_exam_id[i]);
                var sum_score = 0

                for(let j = 0; j < query.part_list.length; j ++){

                    sum_score += Number(query.part_list[j].score);
                }
                //Submit Amount Validate
                const examResultData = await ExamResults.findOne({ exam_id : query._id});
                const student_submit_amont = examResultData.student_result.length/query.part_list.length;
                const student_amount = class_data.student_id.length;
                const status = `${student_submit_amont}/${student_amount}`
    
                const details = {
                    id: query._id,
                    exam_name: query.exam_name,
                    exam_description: query.exam_description,
                    score: sum_score,
                    exam_start_date: query.exam_start_date,
                    exam_end_date: query.exam_end_date,
                    created: moment(query.created),
                    status: status
                }

                exam_data.push(details);
            }
            const sorted_feed_data = exam_data.sort((a, b) => a.created.valueOf() - b.created.valueOf())
            res.status(200).json({result: 'OK', message: '', data: sorted_feed_data.reverse()});
        }
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.stdSubmit = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    const exam_id = req.body.exam_id;
    const submitResult = req.body.data;

    //submit result validation
    if (!classcode||!exam_id||!submitResult||submitResult.length == 0) return res.status(400).json({result: 'Bad request', message: ''});

    var resultNotValid = false
    submitResult.map((key) => {
        if (!key.part_id||!key.part_type||!key.answer||key.answer.length == 0) return resultNotValid = true
    });
    if (resultNotValid) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const class_data = await Classes.findOne({ class_code: classcode });
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.student_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});
        
        if (!class_data.class_exam_id.includes(exam_id)) return res.status(404).json({result: 'Not found', message: ''});
        const exam_data = await Exams.findById(exam_id);
        if (!exam_data) return res.status(404).json({result: 'Not found', message: ''});

        //Validate time
        const now = moment()
        const start = moment(exam_data.exam_start_date);
        const end = moment(exam_data.exam_end_date);
        if (now.isBefore(start) || now.isAfter(end)) return res.status(200).json({result: 'nOK', message: 'Its not the time when you can take the exam'});
        
        //Already submit validate
        const examResultData = await ExamResults.findOne({ exam_id : exam_id});
        const already = examResultData.student_result.map((examKey) => {
            submitResult.map((resultKey) => {
                if (examKey.student_id == user_id && examKey.part_id == resultKey.part_id) return resultKey
            });
        });
        if (!already.length == 0) return res.status(200).json({result: 'nOK', message: 'You already submit this exam'});

        //Create result schema
        const stdResultData = await ExamResults.findOne({ exam_id : exam_id});
        submitResult.map( async (key,index) => {
            const resultSchema = {
                student_id: user_id,
                part_id: key.part_id,
                part_type: key.part_type,
                answer: key.answer
            }
            stdResultData.student_result.push(resultSchema);
        });
        const stdResultSaveData = await ExamResults.findOneAndUpdate({ exam_id: exam_id}, stdResultData);
        res.status(200).json({result: 'OK', message: 'success submit exam result'});

    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }

};

exports.scoreSubjective = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    const exam_id = req.body.exam_id;
    const score_data = req.body.data;

    if (!classcode||!exam_id||!score_data) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const class_data = await Classes.findOne({ class_code: classcode });
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        if (!class_data.class_exam_id.includes(exam_id)) return res.status(404).json({result: 'Not found', message: ''});

        const exam_data = await Exams.findById(exam_id);
        if (!exam_data) return res.status(404).json({result: 'Not found', message: ''});
        const exam_result_data = await ExamResults.findOne({ exam_id : exam_id });

        const partIdArr = exam_data.part_list.map((part) => {
            if (part.type == 'subjective') return part.part_id
        })

        const alreadyScoreStdArr = exam_result_data.student_score.map((score) => {
            if (partIdArr.includes(score.part_id)) return score.student_id+score.part_id
        });

        const isScorePartValid = score_data.map(key => {
            if (!partIdArr.includes(key.part_id)||key.part_type == "objective") return;
            return key
        });

        if ( typeof isScorePartValid[0] == "undefined") return res.status(400).json({result: 'Bad request', message: ''});

        score_data.map(key => {
            alreadyScoreStdArr.map(alreadyVal => {
                if (alreadyVal == key.student_id+key.part_id) {
                    exam_result_data.student_score.map((std,index) => {
                        if (std.student_id+std.part_id == key.student_id+key.part_id && std.part_type == 'subjective') {
                            exam_result_data.student_score.splice(index,1)
                        }
                    });
                }
            });
            exam_result_data.student_score.push(key);
        });
        

        await ExamResults.findOneAndUpdate({ exam_id: exam_id}, exam_result_data); 
        res.status(200).json({result: 'OK', message: 'success add student subjective score'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.getResultForTeacher = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    const exam_id = req.body.exam_id;

    if (!classcode||!exam_id) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const class_data = await Classes.findOne({ class_code: classcode });
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        if (!class_data.class_exam_id.includes(exam_id)) return res.status(404).json({result: 'Not found', message: ''});

        const exam_data = await Exams.findById(exam_id);
        if (!exam_data) return res.status(404).json({result: 'Not found', message: ''});
        const exam_result_data = await ExamResults.findOne({ exam_id : exam_id });

        const partIdArr = exam_data.part_list.map((part) => {
            if (part.type == 'objective') return part.part_id
        })

        const alreadyScoreStdArr = exam_result_data.student_score.map((score) => {
            if (partIdArr.includes(score.part_id)) return score.student_id+score.part_id
        });

        const stdScoreData = await ExamResults.findOne({ exam_id : exam_id});
        const mapPromises = exam_data.part_list.map(async (part) => {
            const promises =  exam_result_data.student_result.map( async (result,index) => {
                const stdPartScore = []
                if (result.part_type == 'objective' && result.part_id == part.part_id) {
                    const partAnswer = part.item.map((item) => {
                        return item.answer
                    });
        
                    const partScore = part.item.map((item) => {
                        return item.score
                    });

                    for (let i = 0 ; i < partAnswer.length ; i++) {
                        if (arraysEqual(partAnswer[i],result.answer[i])) {
                            stdPartScore.push(Number(partScore[i]));
                        }
                        else {
                            stdPartScore.push(0);
                        }
                    }
                    
                    const scoreSchema = {
                        student_id: result.student_id,
                        part_id: part.part_id,
                        part_type: part.type,
                        part_score: stdPartScore,
                        sum_score: stdPartScore.reduce((previousValue, currentValue) => previousValue + currentValue)
                    }

                    alreadyScoreStdArr.map(alreadyVal => {
                        if (alreadyVal == result.student_id+result.part_id) {
                            stdScoreData.student_score.map((std,index) => {
                                if (std.student_id+std.part_id == result.student_id+result.part_id && std.part_type == 'objective') {
                                    stdScoreData.student_score.splice(index,1)
                                }
                            });
                        }
                    });
                    stdScoreData.student_score.push(scoreSchema);    
                }
            });

            return await Promise.all(promises)
        })

        Promise.all(mapPromises).then( async () => {
            await ExamResults.findOneAndUpdate({ exam_id: exam_id}, stdScoreData); 
            const new_exam_result_data = await ExamResults.findOne({ exam_id : exam_id });

            
            const std_result_res_arr = []
            new_exam_result_data.student_result.map(key => {
                const std_result = {
                    name: [{}],
                    part_id: "",
                    part_type: "",
                    answer: []
                }
                class_data.nickname.map(nickKey => {
                    if (nickKey.user_id == key.student_id) {
                        std_result.name = [nickKey];
                    }
                })
                std_result.part_id = key.part_id;
                std_result.part_type = key.part_type;
                std_result.answer = key.answer;
                std_result_res_arr.push(std_result);
            });

            
            const std_score_res_arr = []
            new_exam_result_data.student_score.map(key => {
                const std_score = {
                    name: [{}],
                    part_id: "",
                    part_type: "",
                    part_score: [],
                    sum_score: 0
                }
                class_data.nickname.map(nickKey => {
                    if (nickKey.user_id == key.student_id) {
                        std_score.name = [nickKey];
                    }
                });
                std_score.part_id = key.part_id;
                std_score.part_type = key.part_type;
                std_score.part_score = key.part_score;
                std_score.sum_score = key.sum_score;
                std_score_res_arr.push(std_score);
            });

            const resObj = {
                id: new_exam_result_data._id,
                exam_id: new_exam_result_data.exam_id,
                class_code: new_exam_result_data.class_code,
                student_result: std_result_res_arr,
                student_score: std_score_res_arr
            }
            res.status(200).json({result: 'OK', message: '', data: [resObj]});
        }) 
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.create = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;

    //exam validation
    const exam = req.body.exam;
    if (!classcode||!exam) return res.status(400).json({result: 'Bad request', message: ''});
    if (!exam.exam_name||!exam.part_list||!exam.exam_start_date||!exam.exam_end_date) return res.status(400).json({result: 'Bad request', message: ''})
    //part_list should have validation || this method just create empty teacher edit add choice then edit the model later
    
    try {
        const class_data = await Classes.findOne({ class_code: classcode });
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        exam.author = user_id;
        const data = await Exams.create(exam);
        const exam_id = data._id
        class_data.class_exam_id.push(exam_id);
        const new_class_data = await Classes.findOneAndUpdate({ class_code: classcode }, class_data);        
        
        const resultSchema = {
            exam_id: exam_id,
            class_code: classcode,
            student_result: [],
            student_score: [],
        }
        
        const examResultData = await ExamResults.create(resultSchema);
        res.status(200).json({result: 'OK', message: 'success created exam'});
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.edit = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;

    //exam validation
    const exam = req.body.data;
    if (!classcode||!exam) return res.status(400).json({result: 'Bad request', message: ''});
    if (!exam.id||!exam.exam_name||!exam.part_list||!exam.exam_start_date||!exam.exam_end_date||!exam.optional_setting) return res.status(400).json({result: 'Bad request', message: ''})
    
    const exam_id = exam.id

    try {
        const exam_data = await Exams.findById(exam_id);
        if (!exam_data) return res.status(404).json({result: 'Not found', message: ''});
        if (exam_data.author != exam.author) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        const class_data = await Classes.findOne({ class_code: classcode });
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});
        
        //Validate time
        const now = moment()
        const start = moment(exam_data.exam_start_date);
        const end = moment(exam_data.exam_end_date);
        if (now.isBefore(end) && now.isAfter(start)) return res.status(200).json({result: 'nOK', message: 'Its not the time when you can take the exam'});
        
        if ( typeof exam.optional_setting.random_question != 'boolean' || typeof exam.optional_setting.random_choice != 'boolean' || typeof exam.optional_setting.std_getResult != 'boolean') return res.status(400).json({result: 'Bad request', message: ''})

        const class_exam_result = await ExamResults.findOne({ exam_id: exam_id, class_code: classcode });
        if (class_exam_result.student_result.length == 0 && class_exam_result.student_score.length == 0) {
            //edit all settings
            await Exams.findByIdAndUpdate(exam_id, exam);
            res.status(200).json({result: 'OK', message: 'success edit exam'});
        }
        else {
            //edit only part information like choice,answer if want to add a new part should delete all result before edit
            const exam_data_part = exam_data.part_list.map( key => {
                return key.part_id+key.type+key.item.length
            });
           
            const exam_part = exam.part_list.map( key => {
                return key.part_id+key.type+key.item.length
            });

            //เพิ่มหรือลบไม่ได้เลย ถ้ามี ifนี้
            if (exam_data_part.length != exam_part.length) return res.status(400).json({result: 'Bad request', message: ''});
            //เพิ่มได้ลบไม่ได้
            for (let i = 0 ; i < exam_data_part.length ; i++){
                if (exam_data_part[i] != exam_part[i]) return res.status(400).json({result: 'Bad request', message: ''});
            }
            await Exams.findByIdAndUpdate(exam_id, exam);
            res.status(200).json({result: 'OK', message: 'success edit exam'});
        }
        
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.delete = async (req,res) => {
    //delete all exam model
    const user_id = req.userId;
    const exam_id = req.body.exam_id;

    if (!exam_id) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const exam_data = await Exams.findById(exam_id);
        if (!exam_data) return res.status(404).json({result: 'Not found', message: ''});
        if (exam_data.author != user_id) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        const class_data = await Classes.find({ class_exam_id: exam_id });
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});

        for(let i = 0; i < class_data.length ; i++){
            const class_exam_id = class_data[i].class_exam_id;
            const class_exam_id_index = class_exam_id.indexOf(exam_id);
            class_exam_id.splice(class_exam_id_index,1)
            await Classes.findOneAndUpdate({class_code: class_data[i].class_code}, class_data);
        }

        const new_exam_data = await Exams.findByIdAndDelete(exam_id);
        const new_exam_result_data = await ExamResults.deleteMany({exam_id: exam_id});
        

        res.status(200).json({result: 'OK', message: 'success delete exam'});
        
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};

exports.deleteResult = async (req,res) => {
    const user_id = req.userId;
    const classcode = req.body.class_code;
    const exam_id = req.body.exam_id;

    if (!exam_id) return res.status(400).json({result: 'Bad request', message: ''});

    try {
        const exam_data = await Exams.findById(exam_id);
        if (!exam_data) return res.status(404).json({result: 'Not found', message: ''});

        const class_data = await Classes.findOne({ class_code: classcode });
        if (!class_data) return res.status(404).json({result: 'Not found', message: ''});
        if (!class_data.teacher_id.includes(user_id)) return res.status(403).json({result: 'Forbiden', message: 'access is denied'});

        const class_exam_result = await ExamResults.findOne({ exam_id: exam_id, class_code: classcode });
        class_exam_result.student_result = []
        class_exam_result.student_score = []

        const new_class_exam_result = await ExamResults.findOneAndUpdate({ exam_id : exam_id, class_code: classcode},class_exam_result);

        res.status(200).json({result: 'OK', message: 'success delete exam result'});
        
    } catch (e) {
        res.status(500).json({result: 'Internal Server Error', message: ''});
    }
};