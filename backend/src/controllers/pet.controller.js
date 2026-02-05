const Pet = require('../models/Pet.model');

// 1. Tạo thú cưng mới (POST)
exports.createPet = async (req, res) => {
    try {
        const { name, species, breed, gender, birthday, weight, note, img_url, category } = req.body;
        const userId = req.userId; 

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Không xác định được người dùng!' });
        }

        let finalImgUrl = img_url || '';
        if (req.file) {
            finalImgUrl = req.file.path;
        }

        const newPet = new Pet({
            name, species, breed, gender, birthday, weight, note, 
            img_url: finalImgUrl,
            owner: userId,
            category: category || 'owned'
        });

        await newPet.save();

        res.status(201).json({
            success: true,
            message: 'Đã thêm thú cưng thành công! 🐾',
            data: newPet
        });

    } catch (error) {
        console.log("Lỗi tạo pet:", error);
        res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
    }
};

// 2. Lấy danh sách thú cưng (GET)
exports.getPets = async (req, res) => {
    try {
        const userId = req.userId;
        const { category } = req.query;

        // Bộ lọc cơ bản: Của user này
        let filter = { owner: userId };

        // Xử lý cho thú cưng cũ (chưa có category)
        if (category) {
            if (category === 'owned') {
                filter.$or = [
                    { category: 'owned' },
                    { category: { $exists: false } }, 
                    { category: null },              
                    { category: '' }                 
                ];
            } else {
                filter.category = category;
            }
        }

        const pets = await Pet.find(filter).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: pets.length,
            data: pets
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách: ' + error.message });
    }
};

// 3. Hàm xóa thú cưng (DELETE)
exports.deletePet = async (req, res) => {
    try {
        const deletedPet = await Pet.findOneAndDelete({ 
            _id: req.params.id, 
            owner: req.userId 
        });

        if (!deletedPet) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thú cưng hoặc bạn không có quyền xóa!' });
        }

        res.json({ success: true, message: 'Đã xóa thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa' });
    }
};

// 4. CẬP NHẬT THÔNG TIN THÚ CƯNG
exports.updatePet = async (req, res) => {
    try {
        const { name, species, breed, age, weight, gender, note, contact_info, category } = req.body;
        
        let updateData = {
            name, species, breed, note, contact_info,
            category, 
            age: age ? Number(age) : undefined,
            weight: weight ? Number(weight) : undefined,
            gender
        };
    
        if (req.file) {
            updateData.img_url = req.file.path;
        }
    
        const updatedPet = await Pet.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true } 
        );
    
        if (!updatedPet) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thú cưng' });
        }
    
        res.json({ success: true, data: updatedPet });
    
    } catch (error) {
        console.error("Lỗi update pet:", error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật' });
    }
};

// 5. Thêm hồ sơ sức khỏe
exports.addMedicalRecord = async (req, res) => {
    try {
        const { date, type, title, description, doctor } = req.body;

        const pet = await Pet.findOneAndUpdate(
            { _id: req.params.id, owner: req.userId },
            { 
                $push: { 
                    medical_records: { date, type, title, description, doctor } 
                } 
            },
            { new: true }
        );

        if (!pet) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thú cưng!' });
        }

        res.json({ success: true, message: 'Đã thêm hồ sơ thành công!', data: pet });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
    }
};

// 6. Lấy chi tiết một thú cưng
exports.getPet = async (req, res) => {
    try {
        const pet = await Pet.findOne({ _id: req.params.id, owner: req.userId });
        if (!pet) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thú cưng!' });
        }
        res.json({ success: true, data: pet });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// 7. Sửa một dòng trong sổ khám bệnh
exports.updateMedicalRecord = async (req, res) => {
    try {
        const { petId, recordId } = req.params;
        const { date, title, description, doctor, next_appointment } = req.body; 

        let updateFields = {
            "medical_records.$.date": date,
            "medical_records.$.title": title,
            "medical_records.$.description": description,
            "medical_records.$.doctor": doctor,
            "medical_records.$.next_appointment": next_appointment 
        };

        if (req.file) {
            updateFields["medical_records.$.img_url"] = req.file.path;
        }

        const pet = await Pet.findOneAndUpdate(
            { _id: petId, "medical_records._id": recordId, owner: req.userId },
            { $set: updateFields },
            { new: true }
        );

        if (!pet) return res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi!' });

        res.json({ success: true, message: 'Cập nhật thành công!', data: pet });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi update medical: ' + error.message });
    }
};

// 8. Xóa một dòng trong sổ khám bệnh
exports.deleteMedicalRecord = async (req, res) => {
    try {
        const { petId, recordId } = req.params;

        const pet = await Pet.findOneAndUpdate(
            { _id: petId, owner: req.userId },
            { $pull: { medical_records: { _id: recordId } } }, 
            { new: true }   
        );

        if (!pet) return res.status(404).json({ success: false, message: 'Không tìm thấy thú cưng!' });

        res.json({ success: true, message: 'Đã xóa hồ sơ!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xóa medical: ' + error.message });
    }
};

// --- 👇 MỚI: QUẢN LÝ ĂN UỐNG (DIET) ---

// 9. Thêm lịch ăn
exports.addDietPlan = async (req, res) => {
    try {
        const { time, title, food, amount, note } = req.body;
        const pet = await Pet.findOneAndUpdate(
            { _id: req.params.id, owner: req.userId },
            { $push: { diet_plans: { time, title, food, amount, note } } },
            { new: true }
        );
        res.json({ success: true, data: pet });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// 10. Xóa lịch ăn
exports.deleteDietPlan = async (req, res) => {
    try {
        const { petId, dietId } = req.params;
        const pet = await Pet.findOneAndUpdate(
            { _id: petId, owner: req.userId },
            { $pull: { diet_plans: { _id: dietId } } },
            { new: true }
        );
        res.json({ success: true, data: pet });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// 11. Thêm bản ghi cân nặng
exports.addWeightRecord = async (req, res) => {
    try {
        const { weight, date, note } = req.body;
        
        // 1. Tìm và cập nhật mảng lịch sử (weight_history)
        // 2. ĐỒNG THỜI cập nhật luôn field 'weight' (cân nặng hiện tại) để hiển thị ở trang chủ/chi tiết
        const pet = await Pet.findOneAndUpdate(
            { _id: req.params.id, owner: req.userId },
            { 
                $push: { weight_history: { weight, date, note } },
                $set: { weight: weight }  // 👈 DÒNG QUAN TRỌNG NÀY SẼ UPDATE CÂN NẶNG MỚI NHẤT
            },
            { new: true }
        );
        
        res.json({ success: true, data: pet });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// 12. Xóa bản ghi cân nặng
exports.deleteWeightRecord = async (req, res) => {
    try {
        const { petId, recordId } = req.params;
        const pet = await Pet.findOneAndUpdate(
            { _id: petId, owner: req.userId },
            { $pull: { weight_history: { _id: recordId } } },
            { new: true }
        );
        // (Nâng cao: Có thể logic để cập nhật lại weight = cái mới nhất còn lại, nhưng tạm thời bỏ qua cho đơn giản)
        res.json({ success: true, data: pet });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};