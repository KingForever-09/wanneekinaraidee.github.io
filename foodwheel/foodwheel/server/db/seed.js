// Run with: npm run seed
// Safe to re-run — it only inserts categories/foods that don't already exist yet,
// so any edits made through the site (or by users) are never overwritten.
const db = require('./index');
const RECIPES = require('./recipes-seed');

const CATEGORIES = [
  { key: 'noodles', label: 'Noodles', emoji: '🍜', sort_order: 1,
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRqrtEUqD2TRbUUdYc55GKaZRYQx4QcwmLYtBnSUNBjztDJtVPIeSmNL4&s=10' },
  { key: 'rice', label: 'Rice', emoji: '🍚', sort_order: 2,
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThjpaixFguvR29T9CmpHzJf0_IZpqyTITf5XTYe2Bnntlk2DGOqWFRZ-w&s=10' },
  { key: 'sweets', label: 'Sweets', emoji: '🍰', sort_order: 3,
    img: 'https://thebaklavabox.com/cdn/shop/products/sugar-free-assorted-indian-fusion-sweets-400g-416448.jpg?v=1745425387' },
  { key: 'soup', label: 'Soup', emoji: '🍲', sort_order: 4, img: '' },
  { key: 'seafood', label: 'Seafood', emoji: '🦐', sort_order: 5, img: '' },
  { key: 'salad', label: 'Salad', emoji: '🥗', sort_order: 6, img: '' },
];

const FOODS = {
  noodles: [
    { name: 'Pad Thai (ผัดไทย)', kcal: 486, protein: 18, carbs: 60, fat: 18, benefit: 'มีโปรตีนจากกุ้ง/ไข่และถั่วลิสงช่วยเสริมพลังงาน พร้อมถั่วงอกที่ให้ใยอาหาร', img: 'https://thai-foodie.com/wp-content/uploads/2025/08/plated-gluten-free-pad-thai.jpg' },
    { name: 'Ramen (ราเมง)', kcal: 520, protein: 24, carbs: 65, fat: 16, benefit: 'น้ำซุปกระดูกอุดมคอลลาเจนช่วยบำรุงข้อต่อและผิวพรรณ', img: 'https://cdn.apartmenttherapy.info/image/upload/f_auto,q_auto:eco,c_fill,g_auto,w_1500,ar_3:2/k%2FPhoto%2FRecipes%2F2024-03-tonkotsu-ramen%2Ftonkotsu-ramen-195' },
    { name: 'Spaghetti Carbonara', kcal: 610, protein: 22, carbs: 64, fat: 26, benefit: 'ไข่และชีสให้แคลเซียมและโปรตีนคุณภาพสูงสำหรับซ่อมแซมกล้ามเนื้อ', img: 'https://images.services.kitchenstories.io/6glN_4JhpVS9aUiBS7JnGsuDULA=/3840x0/filters:quality(80)/images.kitchenstories.io/wagtailOriginalImages/R2568-photo-final-_0.jpg' },
    { name: 'Wide Rice Noodles with Gravy Sauce (ราดหน้า)', kcal: 450, protein: 18, carbs: 58, fat: 15, benefit: 'คะน้าในซอสราดหน้าให้วิตามินเคและใยอาหาร แป้งมันข้นให้พลังงานอิ่มนาน', img: '' },
    { name: 'Lasagna', kcal: 660, protein: 30, carbs: 55, fat: 32, benefit: 'ชั้นชีสและเนื้อสัตว์ให้แคลเซียมและธาตุเหล็กสูง เหมาะมื้อหลัก', img: 'https://amandascookin.com/wp-content/uploads/2025/08/Italian-Lasagna-RCSQ.jpg' },
    { name: 'Mac and Cheese', kcal: 570, protein: 20, carbs: 58, fat: 27, benefit: 'ชีสอุดมแคลเซียมช่วยเสริมสร้างกระดูกให้แข็งแรง', img: 'https://images.services.kitchenstories.io/FQPoYXqopSF8apn6ZCB6uEaXVyk=/3840x0/filters:quality(85)/images.kitchenstories.io/wagtailOriginalImages/R3072-final-photo-2.jpg' },
    { name: 'Udon (อุด้ง)', kcal: 430, protein: 14, carbs: 78, fat: 5, benefit: 'คาร์โบไฮเดรตเชิงซ้อนให้พลังงานยาวนาน ไขมันต่ำ', img: 'https://thewoksoflife.com/wp-content/uploads/2026/03/beef-udon-niku-udon-16.jpg' },
    { name: 'Khanom Jeen (ขนมจีน)', kcal: 350, protein: 12, carbs: 65, fat: 8, benefit: 'เส้นขนมจีนผ่านการหมักตามธรรมชาติ ย่อยง่ายและมีดัชนีน้ำตาลต่ำกว่าเส้นทั่วไป มักเสิร์ฟพร้อมผักสดหลากชนิด', img: '' },
    { name: 'Pad See Ew (ผัดซีอิ๊ว)', kcal: 455, protein: 17, carbs: 58, fat: 15, benefit: 'คะน้าอุดมวิตามินเค ช่วยการแข็งตัวของเลือดและสุขภาพกระดูก', img: 'https://s359.kapook.com/pagebuilder/09a92003-6eb9-4d67-b0b5-5334af7bc019.jpg' },
    { name: 'Yakisoba (ยากิโซบะ)', kcal: 410, protein: 15, carbs: 56, fat: 13, benefit: 'กะหล่ำปลีและผักตามฤดูช่วยเสริมใยอาหารและวิตามินซี', img: '' },
    { name: 'Khao Soi (ข้าวซอย)', kcal: 540, protein: 20, carbs: 48, fat: 28, benefit: 'กะทิและขมิ้นมีสารต้านการอักเสบตามธรรมชาติ', img: 'https://www.unileverfoodsolutions.co.th/dam/global-ufs/mcos/SEA/calcmenu/recipes/TH-recipes/chicken-&-other-poultry-dishes/%E0%B8%82%E0%B9%89%E0%B8%B2%E0%B8%A7%E0%B8%8B%E0%B8%AD%E0%B8%A2%E0%B9%84%E0%B8%81%E0%B9%88/main-header.jpg' },
    { name: 'Drunken Noodles (ผัดขี้เมา)', kcal: 470, protein: 18, carbs: 55, fat: 18, benefit: 'ใบกะเพราและพริกช่วยกระตุ้นการเผาผลาญและระบบไหลเวียน', img: '' },
    { name: 'Singapore Noodles', kcal: 445, protein: 19, carbs: 54, fat: 15, benefit: 'ผงกะหรี่มีสารต้านอนุมูลอิสระ ช่วยเสริมภูมิคุ้มกัน', img: '' },
    { name: 'Bolognese', kcal: 590, protein: 28, carbs: 58, fat: 24, benefit: 'เนื้อบดอุดมธาตุเหล็กและวิตามินบี12 ดีต่อการสร้างเม็ดเลือด', img: '' },
    { name: 'Soba (โซบะ)', kcal: 340, protein: 14, carbs: 63, fat: 2, benefit: 'เส้นบัควีตมีรูตินช่วยเสริมความแข็งแรงของหลอดเลือด', img: '' },
    { name: 'Japchae (จับแช)', kcal: 380, protein: 10, carbs: 60, fat: 11, benefit: 'วุ้นเส้นมันเทศไขมันต่ำ ผักหลายชนิดเสริมไฟเบอร์', img: '' },
    { name: 'Bun Cha (บุนฉ่า)', kcal: 420, protein: 22, carbs: 50, fat: 14, benefit: 'สมุนไพรสดอย่างสะระแหน่ช่วยระบบย่อยอาหารและให้วิตามินเอ', img: '' },
    { name: 'Chow Mein', kcal: 460, protein: 16, carbs: 60, fat: 15, benefit: 'ผักผัดหลากชนิดช่วยเพิ่มวิตามินซีและใยอาหาร', img: '' },
    { name: 'Topokki (ต๊อกบกกี)', kcal: 400, protein: 10, carbs: 80, fat: 3, benefit: 'คาร์โบไฮเดรตสูงให้พลังงานเยอะ', img: '' },
    { name: 'Spätzle (เส้นเยอรมัน)', kcal: 520, protein: 17, carbs: 65, fat: 18, benefit: 'ไข่ในเส้นให้โคลีนช่วยการทำงานของสมองและตับ', img: '' },
  ],
  rice: [
    { name: 'Khao Pad (ข้าวผัด)', kcal: 520, protein: 18, carbs: 68, fat: 18, benefit: 'ไข่และผักรวมให้พลังงานครบถ้วนในจานเดียว', img: '' },
    { name: 'Sushi (ซูชิ)', kcal: 350, protein: 20, carbs: 50, fat: 8, benefit: 'ปลาดิบอุดมโอเมก้า-3 ช่วยบำรุงสมองและหัวใจ', img: 'https://takestwoeggs.com/wp-content/uploads/2025/02/Sushi-at-home.jpg' },
    { name: 'Biryani (ข้าวหมก)', kcal: 580, protein: 26, carbs: 68, fat: 20, benefit: 'เครื่องเทศอย่างขมิ้นและอบเชยมีสารต้านการอักเสบ เนื้อไก่ให้โปรตีนสูง', img: '' },
    { name: 'Pad Kra Pao (ผัดกระเพรา)', kcal: 470, protein: 24, carbs: 45, fat: 22, benefit: 'ใบกะเพรามีสารต้านอนุมูลอิสระ พริกช่วยกระตุ้นการเผาผลาญ เนื้อสัตว์สับให้โปรตีนสูง', img: '' },
    { name: 'Khao Khluk Kapi (ข้าวคลุกกะปิ)', kcal: 480, protein: 16, carbs: 60, fat: 16, benefit: 'กะปิให้แคลเซียมและรสอูมามิ มะม่วงเปรี้ยวเสริมวิตามินซี กุ้งแห้งให้โปรตีน', img: '' },
    { name: 'American fried rice (ข้าวผัดอเมริกัน)', kcal: 650, protein: 20, carbs: 72, fat: 28, benefit: 'มื้อพลังงานสูงจากไก่ทอด ไส้กรอก และไข่ดาว เหมาะสำหรับวันที่ต้องใช้พลังงานมาก ควรกินแต่พอดีเพราะไขมันค่อนข้างสูง', img: '' },
    { name: 'Rice Soup (ข้าวต้ม)', kcal: 220, protein: 10, carbs: 38, fat: 4, benefit: 'ย่อยง่าย ไขมันต่ำ เหมาะสำหรับมื้อเบาๆ หรือวันที่ไม่สบายท้อง', img: '' },
    { name: 'Bibimbap (บิบิมบับ)', kcal: 560, protein: 22, carbs: 65, fat: 20, benefit: 'ผักหลากสีให้วิตามินครบถ้วน เหมาะสำหรับมื้อสมดุล', img: '' },
    { name: 'Khao Man Gai (ข้าวมันไก่)', kcal: 600, protein: 30, carbs: 62, fat: 24, benefit: 'อกไก่ให้โปรตีนสูง ช่วยซ่อมแซมกล้ามเนื้อ', img: 'https://www.allrecipes.com/thmb/dInTiw4LBN4FfnAJG6-mDE4RpLA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/3572007-5ab08518c35e464bb04fd7dfc535ee47.jpg' },
    { name: 'Congee (โจ๊ก)', kcal: 250, protein: 10, carbs: 45, fat: 3, benefit: 'ย่อยง่าย เหมาะสำหรับผู้ป่วยหรือมื้อเช้าเบาๆ', img: 'https://pickledplum.com/wp-content/uploads/2019/11/basic-congee-recipe-3-1200.jpg' },
    { name: 'Omelette rice (ข้าวไข่เจียว)', kcal: 480, protein: 14, carbs: 55, fat: 20, benefit: 'ไข่ให้โคลีนและโปรตีนคุณภาพดี เมนูง่ายๆ ที่ทำเองได้เร็ว', img: '' },
    { name: 'Onigiri (โอนิกิริ)', kcal: 180, protein: 4, carbs: 38, fat: 1, benefit: 'แคลอรีต่ำ พกพาง่าย เหมาะเป็นของว่างให้พลังงานเร็ว', img: '' },
    { name: 'Grilled Chicken with Sticky Rice (ไก่ย่างข้าวเหนียว)', kcal: 560, protein: 30, carbs: 65, fat: 16, benefit: 'ไก่ย่างให้โปรตีนสูงไขมันต่ำกว่าไก่ทอด ข้าวเหนียวให้พลังงานอิ่มนาน', img: '' },
    { name: 'Sticky rice with fried pork (ข้าวเหนียวหมูทอด)', kcal: 600, protein: 22, carbs: 60, fat: 28, benefit: 'ให้พลังงานสูงและโปรตีนจากหมูทอด ควรกินแต่พอดีเนื่องจากไขมันค่อนข้างสูงจากการทอด', img: '' },
    { name: 'Roasted Duck with Rice (ข้าวหน้าเป็ด)', kcal: 550, protein: 26, carbs: 55, fat: 22, benefit: 'เนื้อเป็ดอุดมธาตุเหล็กและวิตามินบี ซอสราดให้รสเข้มข้น', img: '' },
    { name: 'Donburi (ดงบุริ)', kcal: 550, protein: 26, carbs: 64, fat: 18, benefit: 'ซอสถั่วเหลืองหมักให้โปรไบโอติกที่ดีต่อลำไส้', img: '' },
    { name: 'Khao Kha Moo (ข้าวขาหมู)', kcal: 640, protein: 28, carbs: 55, fat: 30, benefit: 'คอลลาเจนจากขาหมูช่วยบำรุงผิวและข้อต่อ', img: 'https://hungryinthailand.com/wp-content/uploads/2024/02/khao-kha-moo.webp' },
    { name: 'Gimbap (กิมบับ)', kcal: 380, protein: 14, carbs: 55, fat: 10, benefit: 'สาหร่ายอุดมไอโอดีนช่วยการทำงานของไทรอยด์', img: '' },
    { name: 'Kimchi Fried Rice', kcal: 490, protein: 14, carbs: 62, fat: 16, benefit: 'กิมจิหมักให้โปรไบโอติกดีต่อระบบย่อยอาหาร', img: '' },
    { name: 'Kao Moo Dang (ข้าวหมูแดง)', kcal: 520, protein: 24, carbs: 65, fat: 14, benefit: 'หมูแดงให้โปรตีนสูง มักเสิร์ฟพร้อมไข่ต้มเพิ่มโปรตีนและสารอาหาร', img: '' },
  ],
  sweets: [
    { name: 'Tiramisu', kcal: 420, protein: 6, carbs: 38, fat: 26, benefit: 'คาเฟอีนจากกาแฟช่วยกระตุ้นความตื่นตัวและสมาธิ', img: 'https://www.bunsenburnerbakery.com/wp-content/uploads/2016/06/easy-tiramisu-square-29-720x540.jpg' },
    { name: 'Mango Sticky Rice (ข้าวเหนียวมะม่วง)', kcal: 380, protein: 5, carbs: 68, fat: 10, benefit: 'มะม่วงอุดมวิตามินเอและซีช่วยบำรุงผิวและภูมิคุ้มกัน', img: '' },
    { name: 'Macarons', kcal: 90, protein: 2, carbs: 12, fat: 4, benefit: 'อัลมอนด์ในตัวขนมให้ไขมันดีและวิตามินอี', img: '' },
    { name: 'Churros', kcal: 300, protein: 4, carbs: 38, fat: 15, benefit: 'ให้พลังงานเร็วจากคาร์โบไฮเดรต เหมาะเป็นของว่างมื้อบ่าย', img: '' },
    { name: 'Baklava', kcal: 330, protein: 5, carbs: 40, fat: 18, benefit: 'ถั่วพิสตาชิโอ/วอลนัทให้กรดไขมันโอเมก้า-3', img: '' },
    { name: 'Brownie', kcal: 340, protein: 4, carbs: 45, fat: 17, benefit: 'โกโก้มีฟลาโวนอยด์ช่วยต้านอนุมูลอิสระ', img: '' },
    { name: 'Mochi (โมจิ)', kcal: 180, protein: 2, carbs: 40, fat: 1, benefit: 'ไขมันต่ำ ย่อยง่าย เหมาะเป็นของหวานเบาๆ', img: '' },
    { name: 'Cheesecake', kcal: 400, protein: 7, carbs: 32, fat: 27, benefit: 'ครีมชีสให้แคลเซียมช่วยเสริมสร้างกระดูก', img: '' },
    { name: 'Crème Brûlée', kcal: 350, protein: 5, carbs: 28, fat: 24, benefit: 'ไข่แดงอุดมวิตามินดีและโคลีนดีต่อสมอง', img: '' },
    { name: 'Gulab Jamun', kcal: 300, protein: 4, carbs: 50, fat: 10, benefit: 'นมผงให้แคลเซียม เหมาะของหวานหลังมื้ออาหาร', img: '' },
    { name: 'Pavlova', kcal: 280, protein: 3, carbs: 48, fat: 8, benefit: 'ผลไม้สดด้านบนให้วิตามินซีและใยอาหาร', img: '' },
    { name: 'Apple Pie', kcal: 320, protein: 3, carbs: 50, fat: 13, benefit: 'แอปเปิลมีเพคตินช่วยควบคุมระดับน้ำตาลในเลือด', img: '' },
    { name: 'Tarte Tatin', kcal: 310, protein: 3, carbs: 46, fat: 13, benefit: 'แอปเปิลคาราเมลให้ใยอาหารและความหวานธรรมชาติ', img: '' },
    { name: 'Banoffee Pie', kcal: 430, protein: 5, carbs: 55, fat: 21, benefit: 'กล้วยอุดมโพแทสเซียมช่วยควบคุมความดันโลหิต', img: '' },
    { name: 'Tres Leches Cake', kcal: 380, protein: 6, carbs: 48, fat: 17, benefit: 'นมสามชนิดให้แคลเซียมและโปรตีนสูง', img: '' },
    { name: 'Doughnut', kcal: 300, protein: 4, carbs: 35, fat: 16, benefit: 'ให้พลังงานเร็ว เหมาะเป็นของว่างยามเช้า', img: '' },
    { name: 'Panna Cotta', kcal: 280, protein: 4, carbs: 24, fat: 18, benefit: 'เจลาตินช่วยบำรุงข้อต่อและผิวพรรณ', img: '' },
    { name: 'Éclair', kcal: 290, protein: 5, carbs: 30, fat: 17, benefit: 'ครีมคัสตาร์ดให้พลังงานและโปรตีนเล็กน้อย', img: '' },
    { name: 'Red Velvet Cake', kcal: 410, protein: 5, carbs: 52, fat: 20, benefit: 'โกโก้และครีมชีสให้สารต้านอนุมูลอิสระและแคลเซียม', img: '' },
    { name: 'Egg Tart (ทาร์ตไข่)', kcal: 260, protein: 5, carbs: 26, fat: 15, benefit: 'ไข่ให้โปรตีนคุณภาพดีและวิตามินบี12', img: '' },
  ],
  soup: [
    { name: 'Tom Yum Goong (ต้มยำกุ้ง)', kcal: 250, protein: 18, carbs: 12, fat: 14, benefit: 'ตะไคร้และใบมะกรูดมีฤทธิ์ต้านการอักเสบและช่วยระบบไหลเวียน', img: '' },
    { name: 'Tom Kha Gai (ต้มข่าไก่)', kcal: 320, protein: 20, carbs: 10, fat: 22, benefit: 'ข่าและกะทิให้พลังงานและช่วยระบบย่อยอาหาร', img: '' },
    { name: 'Miso Soup (มิโซะซุป)', kcal: 90, protein: 6, carbs: 8, fat: 3, benefit: 'มิโซะหมักให้โปรไบโอติกดีต่อลำไส้ แคลอรีต่ำ', img: '' },
    { name: 'Tom Jued (ต้มจืด)', kcal: 150, protein: 12, carbs: 8, fat: 6, benefit: 'ซุปอ่อนย่อยง่าย เหมาะสำหรับมื้อเบาๆ', img: '' },
    { name: 'French Onion Soup', kcal: 310, protein: 12, carbs: 30, fat: 15, benefit: 'หัวหอมให้สารต้านอนุมูลอิสระควบคู่กับชีสที่ให้แคลเซียม', img: '' },
    { name: 'Minestrone', kcal: 220, protein: 9, carbs: 34, fat: 6, benefit: 'ผักรวมหลายชนิดให้ใยอาหารและวิตามินหลากหลาย', img: '' },
    { name: 'Hot and Sour Soup', kcal: 180, protein: 10, carbs: 16, fat: 8, benefit: 'พริกไทยและน้ำส้มสายชูช่วยกระตุ้นการเผาผลาญ', img: '' },
    { name: 'Clam Chowder', kcal: 350, protein: 14, carbs: 28, fat: 20, benefit: 'หอยลายให้ธาตุเหล็กและวิตามินบี12สูง', img: '' },
    { name: 'Gaeng Jued Tao Hoo (แกงจืดเต้าหู้)', kcal: 160, protein: 11, carbs: 10, fat: 7, benefit: 'เต้าหู้ให้โปรตีนจากพืชและแคลเซียม ไขมันต่ำ', img: '' },
    { name: 'Chicken Noodle Soup', kcal: 280, protein: 20, carbs: 30, fat: 8, benefit: 'ซุปไก่อุ่นสบายท้อง ช่วยบรรเทาอาการหวัด', img: '' },
    { name: 'Gazpacho', kcal: 120, protein: 3, carbs: 16, fat: 5, benefit: 'มะเขือเทศสดเย็นให้วิตามินซีและไลโคปีนสูง', img: '' },
    { name: 'Khao Tom (ข้าวต้ม)', kcal: 200, protein: 10, carbs: 34, fat: 3, benefit: 'ย่อยง่าย เหมาะเป็นมื้อเช้าหรือมื้อสำหรับผู้ป่วย', img: '' },
  ],
  seafood: [
    { name: 'Grilled Salmon (แซลมอนย่าง)', kcal: 380, protein: 34, carbs: 2, fat: 26, benefit: 'โอเมก้า-3 สูงช่วยบำรุงหัวใจและสมอง', img: '' },
    { name: 'Shrimp Tempura (กุ้งเทมปุระ)', kcal: 340, protein: 20, carbs: 28, fat: 16, benefit: 'กุ้งให้โปรตีนสูงและซีลีเนียมเสริมภูมิคุ้มกัน', img: '' },
    { name: 'Grilled Squid (ปลาหมึกย่าง)', kcal: 220, protein: 28, carbs: 6, fat: 8, benefit: 'โปรตีนสูง ไขมันต่ำ เหมาะสำหรับควบคุมน้ำหนัก', img: '' },
    { name: 'Tod Mun Pla (ทอดมันปลา)', kcal: 260, protein: 16, carbs: 14, fat: 16, benefit: 'ปลาให้โปรตีนคุณภาพดีและไอโอดีน', img: '' },
    { name: 'Steamed Sea Bass with Lime (ปลากะพงนึ่งมะนาว)', kcal: 240, protein: 30, carbs: 8, fat: 8, benefit: 'พริกและมะนาวช่วยกระตุ้นระบบเผาผลาญ ปลาให้โปรตีนไขมันต่ำ', img: '' },
    { name: 'Crab Cakes', kcal: 300, protein: 22, carbs: 16, fat: 17, benefit: 'ปูให้สังกะสีและวิตามินบี12 ดีต่อระบบภูมิคุ้มกัน', img: '' },
    { name: 'Poh Piah Goong (ปอเปี๊ยะกุ้ง)', kcal: 210, protein: 12, carbs: 22, fat: 8, benefit: 'ผักสดในไส้ให้วิตามินและใยอาหารเสริม', img: '' },
    { name: 'Fish and Chips', kcal: 590, protein: 26, carbs: 55, fat: 30, benefit: 'ปลาให้โปรตีนสูง เหมาะเป็นมื้อพลังงานเต็มอิ่ม', img: '' },
    { name: 'Ceviche', kcal: 180, protein: 22, carbs: 10, fat: 5, benefit: 'มะนาวและปลาสดให้วิตามินซีและโปรตีนไขมันต่ำ', img: '' },
    { name: 'Moules Marinières (หอยแมลงภู่อบไวน์)', kcal: 260, protein: 20, carbs: 8, fat: 15, benefit: 'หอยแมลงภู่อุดมธาตุเหล็กและวิตามินบี12', img: '' },
    { name: 'Grilled Prawns (กุ้งเผา)', kcal: 200, protein: 26, carbs: 2, fat: 9, benefit: 'โปรตีนสูงไขมันต่ำ ให้แอสตาแซนธินต้านอนุมูลอิสระ', img: '' },
    { name: 'Pla Rad Prik (ปลาราดพริก)', kcal: 350, protein: 24, carbs: 22, fat: 18, benefit: 'พริกช่วยกระตุ้นระบบเผาผลาญ ปลาให้โปรตีนคุณภาพดี', img: '' },
  ],
  salad: [
    { name: 'Som Tum (ส้มตำ)', kcal: 150, protein: 4, carbs: 24, fat: 5, benefit: 'มะละกอดิบให้วิตามินซีสูงและใยอาหารช่วยระบบย่อย', img: '' },
    { name: 'Larb Gai (ลาบไก่)', kcal: 260, protein: 24, carbs: 10, fat: 13, benefit: 'ไก่ให้โปรตีนสูง สมุนไพรสดช่วยระบบย่อยอาหาร', img: '' },
    { name: 'Greek Salad', kcal: 220, protein: 6, carbs: 12, fat: 17, benefit: 'มะกอกและเฟต้าให้ไขมันดีและแคลเซียม', img: '' },
    { name: 'Caesar Salad', kcal: 320, protein: 12, carbs: 14, fat: 25, benefit: 'ผักกาดโรเมนให้วิตามินเคและใยอาหาร', img: '' },
    { name: 'Yum Woon Sen (ยำวุ้นเส้น)', kcal: 230, protein: 14, carbs: 28, fat: 6, benefit: 'กุ้งและหมูสับให้โปรตีน วุ้นเส้นไขมันต่ำ', img: '' },
    { name: 'Caprese Salad', kcal: 250, protein: 11, carbs: 8, fat: 19, benefit: 'มะเขือเทศให้ไลโคปีน มอสซาเรลลาให้แคลเซียม', img: '' },
    { name: 'Cobb Salad', kcal: 400, protein: 26, carbs: 12, fat: 28, benefit: 'ไข่และไก่ให้โปรตีนสูง เหมาะเป็นมื้อหลัก', img: '' },
    { name: 'Yum Talay (ยำทะเล)', kcal: 210, protein: 22, carbs: 14, fat: 7, benefit: 'อาหารทะเลรวมให้โปรตีนและไอโอดีนสูง ไขมันต่ำ', img: '' },
    { name: 'Waldorf Salad', kcal: 280, protein: 4, carbs: 30, fat: 17, benefit: 'แอปเปิลและวอลนัทให้ใยอาหารและไขมันดี', img: '' },
    { name: 'Quinoa Salad', kcal: 260, protein: 9, carbs: 38, fat: 8, benefit: 'ควินัวให้โปรตีนจากพืชครบถ้วนและใยอาหารสูง', img: '' },
  ],
};

const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (key, label, emoji, img, sort_order) VALUES (@key, @label, @emoji, @img, @sort_order)
`);
const insertFood = db.prepare(`
  INSERT INTO foods (category_key, name, kcal, protein, carbs, fat, benefit, img)
  VALUES (@category_key, @name, @kcal, @protein, @carbs, @fat, @benefit, @img)
`);
const countFoodsInCat = db.prepare(`SELECT COUNT(*) AS c FROM foods WHERE category_key = ?`);

const findFoodByName = db.prepare('SELECT id FROM foods WHERE name = ?');
const hasRecipe = db.prepare('SELECT 1 FROM recipes WHERE food_id = ?');
const insertRecipe = db.prepare(`
  INSERT INTO recipes (food_id, servings, prep_minutes, cook_minutes, ingredients, steps)
  VALUES (@food_id, @servings, @prep_minutes, @cook_minutes, @ingredients, @steps)
`);

const insertAll = db.transaction(() => {
  for (const cat of CATEGORIES) insertCategory.run(cat);

  for (const [catKey, items] of Object.entries(FOODS)) {
    const { c } = countFoodsInCat.get(catKey);
    if (c > 0) continue; // already seeded, don't duplicate
    for (const item of items) {
      insertFood.run({ category_key: catKey, ...item });
    }
  }

  for (const [name, recipe] of Object.entries(RECIPES)) {
    const food = findFoodByName.get(name);
    if (!food) continue; // dish name doesn't match anything seeded (yet)
    if (hasRecipe.get(food.id)) continue; // don't duplicate on re-seed
    insertRecipe.run({
      food_id: food.id,
      servings: recipe.servings,
      prep_minutes: recipe.prep_minutes,
      cook_minutes: recipe.cook_minutes,
      ingredients: JSON.stringify(recipe.ingredients),
      steps: JSON.stringify(recipe.steps),
    });
  }
});

insertAll();
console.log('✅ Database seeded at', require('path').resolve(__dirname, '..', '..', 'data', 'foodwheel.db'));
