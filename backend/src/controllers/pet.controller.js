const Pet = require('../models/Pet.model');

// 1. Tạo thú cưng mới (POST)
exports.createPet = async (req, res) => {
    try {
        const { name, species, breed, gender, birthday, weight, note, img_url } = req.body;
        const userId = req.userId; 

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Không xác định được người dùng!' });
        }

        const newPet = new Pet({
            name, species, breed, gender, birthday, weight, note, img_url,
            owner: userId 
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
        const pets = await Pet.find({ owner: userId }).sort({ createdAt: -1 });

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

// 👇 4. CẬP NHẬT THÔNG TIN THÚ CƯNG (ĐÃ SỬA ĐỂ LƯU CONTACT_INFO)
exports.updatePet = async (req, res) => {
  try {
    // Lấy thông tin từ form gửi lên
    const { name, species, breed, age, weight, gender, note, contact_info } = req.body;
    
    // Tạo đối tượng chứa dữ liệu cần sửa
    let updateData = {
      name,
      species,
      breed,
      note,
      contact_info, // 👈 ĐÃ THÊM DÒNG NÀY ĐỂ LƯU THÔNG TIN LIÊN HỆ QR
      age: age ? Number(age) : undefined, // Chỉ update nếu có giá trị
      weight: weight ? Number(weight) : undefined,
      gender
    };

    // 👇 LOGIC ẢNH: Nếu người dùng có chọn ảnh mới (req.file tồn tại) thì mới cập nhật link ảnh
    // Còn nếu không chọn ảnh mới thì GIỮ NGUYÊN ảnh cũ
    if (req.file) {
      updateData.img_url = req.file.path;
    }

    // Tìm và update (Dùng findByIdAndUpdate cho gọn)
    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true } // Trả về dữ liệu mới sau khi sửa
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
// ⚠️ Lưu ý: Hiện tại chức năng này đã được xử lý trực tiếp bên file 'pet.route.js' để nhận ảnh.
// Hàm dưới đây chỉ để dự phòng hoặc cho các API cũ không có ảnh.
exports.addMedicalRecord = async (req, res) => {
    try {
        const { date, type, title, description, doctor } = req.body;

        // Mình sửa thành medical_records (có gạch dưới) để khớp với Model mới nhất của bạn
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
        const { date, title, description, doctor, next_appointment } = req.body; // Thêm next_appointment

        // Tạo object chứa dữ liệu cần sửa
        // Lưu ý: MongoDB update trong mảng dùng cú pháp "medical_records.$.field"
        let updateFields = {
            "medical_records.$.date": date,
            "medical_records.$.title": title,
            "medical_records.$.description": description,
            "medical_records.$.doctor": doctor,
            "medical_records.$.next_appointment": next_appointment // 👈 Logic mới: Ngày tái khám
        };

        // Nếu có up ảnh mới thì sửa luôn ảnh
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
            { $pull: { medical_records: { _id: recordId } } }, // $pull là lệnh xóa phần tử khỏi mảng
            { new: true }
        );

        if (!pet) return res.status(404).json({ success: false, message: 'Không tìm thấy thú cưng!' });

        res.json({ success: true, message: 'Đã xóa hồ sơ!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xóa medical: ' + error.message });
    }
};