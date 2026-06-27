import {intakeAgent} from '../agents/intakeAgent.js';
import IntakeCase from '../models/IntakeCase.js';

export const uploadDocument = async(req, res)=>{
    console.log('🔥 Upload request received!');  
    console.log('File:', req.file);              
    
    try{
        if(!req.file){
            return res.status(400).json({ success: false, message: " Document required"})
        }
        
        console.log('📁 File exists, calling intakeAgent...');  
        const intakeCase = await intakeAgent(req.file);
        
        console.log('✅ Case created:', intakeCase);  
        res.status(201).json({success: true, data: intakeCase});
    } catch (error) {
        console.log('❌ ERROR:', error.message);  
        res.status(500).json({ error: error.message });
    }
}

export const getCase = async(req, res)=>{
    try{
      const intakeCase = await IntakeCase.findOne({
        caseId: req.params.caseId
      })
      if(!intakeCase){
        return res.status(404).json({
            success: false, 
            message: "Case not found",
        })
      }
      res.status(200).json({
        success: true,
        data: intakeCase,
      })
      
    }catch(error){
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
}