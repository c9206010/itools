/**
 * 共用城市時區資料，時區換算與航班計算都吃這一份。
 * 欄位：[中文名, IANA 時區, 國家或地區, 區域, 英文別名]
 */
(function () {
  'use strict';

  /* [中文名, IANA 時區, 國家或地區, 區域, 英文別名] */
  const ALL = [
    ['台北', 'Asia/Taipei', '台灣', '東亞', 'Taipei Taiwan'],
    ['東京', 'Asia/Tokyo', '日本', '東亞', 'Tokyo Japan'],
    ['大阪', 'Asia/Tokyo', '日本', '東亞', 'Osaka Kyoto'],
    ['札幌', 'Asia/Tokyo', '日本', '東亞', 'Sapporo Hokkaido'],
    ['沖繩', 'Asia/Tokyo', '日本', '東亞', 'Okinawa Naha'],
    ['首爾', 'Asia/Seoul', '韓國', '東亞', 'Seoul Korea'],
    ['釜山', 'Asia/Seoul', '韓國', '東亞', 'Busan'],
    ['北京', 'Asia/Shanghai', '中國', '東亞', 'Beijing China'],
    ['上海', 'Asia/Shanghai', '中國', '東亞', 'Shanghai'],
    ['香港', 'Asia/Hong_Kong', '香港', '東亞', 'Hong Kong'],
    ['澳門', 'Asia/Macau', '澳門', '東亞', 'Macau Macao'],
    ['烏蘭巴托', 'Asia/Ulaanbaatar', '蒙古', '東亞', 'Ulaanbaatar Mongolia'],

    ['新加坡', 'Asia/Singapore', '新加坡', '東南亞', 'Singapore'],
    ['吉隆坡', 'Asia/Kuala_Lumpur', '馬來西亞', '東南亞', 'Kuala Lumpur Malaysia'],
    ['曼谷', 'Asia/Bangkok', '泰國', '東南亞', 'Bangkok Thailand'],
    ['清邁', 'Asia/Bangkok', '泰國', '東南亞', 'Chiang Mai'],
    ['普吉島', 'Asia/Bangkok', '泰國', '東南亞', 'Phuket'],
    ['胡志明市', 'Asia/Ho_Chi_Minh', '越南', '東南亞', 'Ho Chi Minh Saigon Vietnam'],
    ['河內', 'Asia/Ho_Chi_Minh', '越南', '東南亞', 'Hanoi'],
    ['峴港', 'Asia/Ho_Chi_Minh', '越南', '東南亞', 'Da Nang'],
    ['金邊', 'Asia/Phnom_Penh', '柬埔寨', '東南亞', 'Phnom Penh Cambodia'],
    ['永珍', 'Asia/Vientiane', '寮國', '東南亞', 'Vientiane Laos'],
    ['仰光', 'Asia/Yangon', '緬甸', '東南亞', 'Yangon Myanmar'],
    ['馬尼拉', 'Asia/Manila', '菲律賓', '東南亞', 'Manila Philippines'],
    ['宿霧', 'Asia/Manila', '菲律賓', '東南亞', 'Cebu'],
    ['雅加達', 'Asia/Jakarta', '印尼', '東南亞', 'Jakarta Indonesia'],
    ['峇里島', 'Asia/Makassar', '印尼', '東南亞', 'Bali Denpasar'],
    ['汶萊', 'Asia/Brunei', '汶萊', '東南亞', 'Brunei'],

    ['新德里', 'Asia/Kolkata', '印度', '南亞中亞', 'New Delhi India'],
    ['孟買', 'Asia/Kolkata', '印度', '南亞中亞', 'Mumbai Bombay'],
    ['加德滿都', 'Asia/Kathmandu', '尼泊爾', '南亞中亞', 'Kathmandu Nepal'],
    ['可倫坡', 'Asia/Colombo', '斯里蘭卡', '南亞中亞', 'Colombo Sri Lanka'],
    ['達卡', 'Asia/Dhaka', '孟加拉', '南亞中亞', 'Dhaka Bangladesh'],
    ['喀拉蚩', 'Asia/Karachi', '巴基斯坦', '南亞中亞', 'Karachi Pakistan'],
    ['馬爾地夫', 'Indian/Maldives', '馬爾地夫', '南亞中亞', 'Maldives Male'],
    ['塔什干', 'Asia/Tashkent', '烏茲別克', '南亞中亞', 'Tashkent Uzbekistan'],
    ['阿拉木圖', 'Asia/Almaty', '哈薩克', '南亞中亞', 'Almaty Kazakhstan'],

    ['杜拜', 'Asia/Dubai', '阿聯', '中東', 'Dubai UAE Abu Dhabi'],
    ['杜哈', 'Asia/Qatar', '卡達', '中東', 'Doha Qatar'],
    ['利雅德', 'Asia/Riyadh', '沙烏地', '中東', 'Riyadh Saudi'],
    ['特拉維夫', 'Asia/Jerusalem', '以色列', '中東', 'Tel Aviv Israel Jerusalem'],
    ['安曼', 'Asia/Amman', '約旦', '中東', 'Amman Jordan'],
    ['德黑蘭', 'Asia/Tehran', '伊朗', '中東', 'Tehran Iran'],
    ['伊斯坦堡', 'Europe/Istanbul', '土耳其', '中東', 'Istanbul Turkey'],

    ['倫敦', 'Europe/London', '英國', '歐洲', 'London UK England'],
    ['都柏林', 'Europe/Dublin', '愛爾蘭', '歐洲', 'Dublin Ireland'],
    ['里斯本', 'Europe/Lisbon', '葡萄牙', '歐洲', 'Lisbon Portugal Porto'],
    ['巴黎', 'Europe/Paris', '法國', '歐洲', 'Paris France'],
    ['阿姆斯特丹', 'Europe/Amsterdam', '荷蘭', '歐洲', 'Amsterdam Netherlands'],
    ['布魯塞爾', 'Europe/Brussels', '比利時', '歐洲', 'Brussels Belgium'],
    ['柏林', 'Europe/Berlin', '德國', '歐洲', 'Berlin Germany'],
    ['慕尼黑', 'Europe/Berlin', '德國', '歐洲', 'Munich Frankfurt'],
    ['蘇黎世', 'Europe/Zurich', '瑞士', '歐洲', 'Zurich Switzerland Geneva'],
    ['維也納', 'Europe/Vienna', '奧地利', '歐洲', 'Vienna Austria'],
    ['布拉格', 'Europe/Prague', '捷克', '歐洲', 'Prague Czech'],
    ['羅馬', 'Europe/Rome', '義大利', '歐洲', 'Rome Italy'],
    ['米蘭', 'Europe/Rome', '義大利', '歐洲', 'Milan Venice Florence'],
    ['馬德里', 'Europe/Madrid', '西班牙', '歐洲', 'Madrid Spain'],
    ['巴塞隆納', 'Europe/Madrid', '西班牙', '歐洲', 'Barcelona'],
    ['哥本哈根', 'Europe/Copenhagen', '丹麥', '歐洲', 'Copenhagen Denmark'],
    ['奧斯陸', 'Europe/Oslo', '挪威', '歐洲', 'Oslo Norway'],
    ['斯德哥爾摩', 'Europe/Stockholm', '瑞典', '歐洲', 'Stockholm Sweden'],
    ['赫爾辛基', 'Europe/Helsinki', '芬蘭', '歐洲', 'Helsinki Finland'],
    ['雷克雅維克', 'Atlantic/Reykjavik', '冰島', '歐洲', 'Reykjavik Iceland'],
    ['華沙', 'Europe/Warsaw', '波蘭', '歐洲', 'Warsaw Poland Krakow'],
    ['布達佩斯', 'Europe/Budapest', '匈牙利', '歐洲', 'Budapest Hungary'],
    ['雅典', 'Europe/Athens', '希臘', '歐洲', 'Athens Greece Santorini'],
    ['札格瑞布', 'Europe/Zagreb', '克羅埃西亞', '歐洲', 'Zagreb Croatia'],
    ['莫斯科', 'Europe/Moscow', '俄羅斯', '歐洲', 'Moscow Russia'],
    ['基輔', 'Europe/Kyiv', '烏克蘭', '歐洲', 'Kyiv Kiev Ukraine'],

    ['開羅', 'Africa/Cairo', '埃及', '非洲', 'Cairo Egypt'],
    ['奈洛比', 'Africa/Nairobi', '肯亞', '非洲', 'Nairobi Kenya'],
    ['約翰尼斯堡', 'Africa/Johannesburg', '南非', '非洲', 'Johannesburg Cape Town'],
    ['卡薩布蘭加', 'Africa/Casablanca', '摩洛哥', '非洲', 'Casablanca Morocco'],
    ['拉哥斯', 'Africa/Lagos', '奈及利亞', '非洲', 'Lagos Nigeria'],
    ['模里西斯', 'Indian/Mauritius', '模里西斯', '非洲', 'Mauritius'],

    ['紐約', 'America/New_York', '美國東岸', '北美', 'New York Boston Washington Miami'],
    ['多倫多', 'America/Toronto', '加拿大', '北美', 'Toronto Montreal Ottawa'],
    ['芝加哥', 'America/Chicago', '美國中部', '北美', 'Chicago Dallas Houston'],
    ['丹佛', 'America/Denver', '美國山區', '北美', 'Denver Salt Lake'],
    ['鳳凰城', 'America/Phoenix', '美國亞利桑那', '北美', 'Phoenix Arizona'],
    ['洛杉磯', 'America/Los_Angeles', '美國西岸', '北美', 'Los Angeles San Francisco Seattle Las Vegas'],
    ['溫哥華', 'America/Vancouver', '加拿大', '北美', 'Vancouver'],
    ['安克拉治', 'America/Anchorage', '阿拉斯加', '北美', 'Anchorage Alaska'],
    ['夏威夷', 'Pacific/Honolulu', '夏威夷', '北美', 'Honolulu Hawaii'],
    ['墨西哥市', 'America/Mexico_City', '墨西哥', '北美', 'Mexico City Cancun'],

    ['哈瓦那', 'America/Havana', '古巴', '中南美', 'Havana Cuba'],
    ['波哥大', 'America/Bogota', '哥倫比亞', '中南美', 'Bogota Colombia'],
    ['利馬', 'America/Lima', '秘魯', '中南美', 'Lima Peru Cusco'],
    ['聖地牙哥', 'America/Santiago', '智利', '中南美', 'Santiago Chile'],
    ['布宜諾斯艾利斯', 'America/Argentina/Buenos_Aires', '阿根廷', '中南美', 'Buenos Aires Argentina'],
    ['聖保羅', 'America/Sao_Paulo', '巴西', '中南美', 'Sao Paulo Rio Brazil'],

    ['雪梨', 'Australia/Sydney', '澳洲', '大洋洲', 'Sydney Canberra Australia'],
    ['墨爾本', 'Australia/Melbourne', '澳洲', '大洋洲', 'Melbourne'],
    ['布里斯本', 'Australia/Brisbane', '澳洲', '大洋洲', 'Brisbane Cairns Gold Coast'],
    ['阿德雷德', 'Australia/Adelaide', '澳洲', '大洋洲', 'Adelaide'],
    ['伯斯', 'Australia/Perth', '澳洲', '大洋洲', 'Perth'],
    ['達爾文', 'Australia/Darwin', '澳洲', '大洋洲', 'Darwin'],
    ['奧克蘭', 'Pacific/Auckland', '紐西蘭', '大洋洲', 'Auckland Christchurch Queenstown'],
    ['斐濟', 'Pacific/Fiji', '斐濟', '大洋洲', 'Fiji Nadi'],
    ['關島', 'Pacific/Guam', '關島', '大洋洲', 'Guam'],
    ['帛琉', 'Pacific/Palau', '帛琉', '大洋洲', 'Palau Koror'],
    ['大溪地', 'Pacific/Tahiti', '大溪地', '大洋洲', 'Tahiti Papeete'],

    ['世界標準時間', 'UTC', 'UTC', '其他', 'UTC GMT']
  ];

  /* 瀏覽器不認得的時區直接剔除，免得整張表壞掉 */
  window.CITY_DB = ALL.filter(function (c) {
    try { new Intl.DateTimeFormat('en', { timeZone: c[1] }); return true; }
    catch (e) { return false; }
  });
})();
