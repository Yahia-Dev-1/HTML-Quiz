# HTML Quiz App

تطبيق تعليمي تفاعلي لتعلم HTML من خلال الاختبارات والتحديات.

## الميزات
- اختبارات متعددة الخيارات
- تحديات برمجة HTML
- تتبع التقدم
- لوحة تحكم للإدارة
- واجهة مستخدم متجاوبة
- نظام نقاط وتلميحات

## التثبيت والتشغيل

1. استنسخ المشروع:
```bash
git clone https://github.com/Yahia-Dev-1/HTML-Quiz.git
cd html-quiz-app-final
```

2. ثبت التبعيات:
```bash
npm install
```

3. أضف متغيرات البيئة في ملف `.env`:
```
JWT_SECRET=your_secret_key_here
MONGO_URI=mongodb://localhost:27017/html-quiz
```

4. شغل الخادم:
```bash
npm start
```

## النشر على Vercel

1. أنشئ حساب على [MongoDB Atlas](https://www.mongodb.com/atlas) واحصل على connection string.

2. في Vercel:
   - Import المشروع من GitHub
   - أضف Environment Variables:
     - `JWT_SECRET`: مفتاح سري قوي
     - `MONGO_URI`: connection string من MongoDB Atlas

3. Deploy

## API Endpoints

### Authentication
- `POST /api/auth/register` - تسجيل مستخدم جديد
- `POST /api/auth/login` - تسجيل الدخول

### Progress
- `GET /api/progress` - الحصول على تقدم المستخدم
- `POST /api/progress/quiz` - تحديث نتيجة اختبار
- `POST /api/progress/challenge` - تحديث إكمال تحدي
- `POST /api/progress/unlock-session` - فتح الجلسة التالية

### Admin
- `GET /api/admin/students` - قائمة الطلاب
- `DELETE /api/admin/students/:id` - حذف طالب

## قاعدة البيانات

يستخدم التطبيق MongoDB مع Mongoose:
- `users`: بيانات المستخدمين والتقدم
- `quizzes`: أسئلة الاختبارات (من ملفات JSON)
- `challenges`: التحديات (من ملفات JSON)

## الأمان

- كلمات المرور مشفرة بـ bcrypt
- JWT tokens للمصادقة
- ملفات البيانات الحساسة مستثناة من Git