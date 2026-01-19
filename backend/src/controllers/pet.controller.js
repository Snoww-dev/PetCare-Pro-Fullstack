const Pet = require('../models/Pet.model');

// 1. Tạo thú cưng mới (POST)
exports.createPet = async (req, res) => {
    try {
        // Lấy thông tin từ người dùng gửi lên
        // (Mình thêm img_url vào để sau này hiển thị ảnh)
        const { name, species, breed, gender, birthday, weight, note, img_url } = req.body;
        
        // ⚠️ QUAN TRỌNG: Middleware của bạn gán ID vào "req.userId", không phải "req.user.id"
        const userId = req.userId; 

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Không xác định được người dùng!' });
        }

        const newPet = new Pet({
            name, species, breed, gender, birthday, weight, note, img_url,
            owner: userId // Gắn thẻ chủ nhân
        });

        await newPet.save();

        res.status(201).json({
            success: true,
            message: 'Đã thêm thú cưng thành công! 🐾',
            data: newPet
        });

    } catch (error) {
        console.log("Lỗi tạo pet:", error); // In lỗi ra terminal để dễ sửa
        res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
    }
};

// 2. Lấy danh sách thú cưng (GET)
// Mình đổi tên thành getPets cho khớp với file route
exports.getPets = async (req, res) => {
    try {
        const userId = req.userId; // Lấy ID chuẩn từ middleware

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

// 4. Cập nhật thông tin thú cưng
exports.updatePet = async (req, res) => {
    try {
        const { name, species, breed, gender, weight, note } = req.body;
        
        // Tìm và cập nhật (chỉ cho phép sửa nếu đúng chủ sở hữu)
        const updatedPet = await Pet.findOneAndUpdate(
            { _id: req.params.id, owner: req.userId },
            { name, species, breed, gender, weight, note },
            { new: true } // Trả về dữ liệu mới sau khi sửa
        );

        if (!updatedPet) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thú cưng!' });
        }

        res.json({ success: true, message: 'Cập nhật thành công!', data: updatedPet });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật' });
    }
};