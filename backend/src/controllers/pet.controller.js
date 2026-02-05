const Pet = require('../models/Pet.model');

// 1. Tạo thú cưng mới (POST)
exports.createPet = async (req, res) => {
    try {
        // 👇 Đã thêm 'category' vào danh sách nhận dữ liệu
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
            // 👇 Lưu loại thú cưng (Mặc định là 'owned' nếu không gửi lên)
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
        
        // 👇 Nhận query param ?category=... từ URL
        const { category } = req.query;

        // Tạo bộ lọc cơ bản: Phải là của User này
        let filter = { owner: userId };

        // Nếu có gửi category lên thì lọc theo category đó
        if (category) {
            filter.category = category;
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
      // 👇 Thêm 'category' vào đây để cho phép cập nhật trạng thái (Nuôi <-> Gặp)
      const { name, species, breed, age, weight, gender, note, contact_info, category } = req.body;
      
      let updateData = {
        name, species, breed, note, contact_info,
        category, // 👈 Lưu category mới vào database
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

// 5. Thêm hồ sơ sức khỏe (Dự phòng)
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