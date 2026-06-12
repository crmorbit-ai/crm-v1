// Country → State → City cascading data

export const LOCATION_DATA = {
  'India': {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Kakinada', 'Rajahmundry', 'Kadapa', 'Anantapur', 'Eluru', 'Ongole', 'Nandyal', 'Machilipatnam', 'Adoni', 'Tenali', 'Chittoor', 'Hindupur', 'Proddatur', 'Srikakulam', 'Bhimavaram', 'Tadepalligudem', 'Guntakal', 'Dharmavaram', 'Gudivada', 'Other'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Namsai', 'Tawang', 'Ziro', 'Bomdila', 'Tezu', 'Seppa', 'Changlang', 'Along', 'Anini', 'Other'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tezpur', 'Tinsukia', 'Bongaigaon', 'Dhubri', 'Diphu', 'North Lakhimpur', 'Karimganj', 'Sivasagar', 'Goalpara', 'Barpeta', 'Golaghat', 'Haflong', 'Mangaldoi', 'Lumding', 'Hailakandi', 'Other'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Danapur', 'Bettiah', 'Saharsa', 'Sasaram', 'Hajipur', 'Dehri', 'Siwan', 'Motihari', 'Nawada', 'Bagaha', 'Buxar', 'Kishanganj', 'Sitamarhi', 'Jamalpur', 'Jehanabad', 'Aurangabad', 'Other'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur', 'Mahasamund', 'Dhamtari', 'Chirmiri', 'Bhatapara', 'Dalli-Rajhara', 'Naila Janjgir', 'Tilda Newra', 'Mungeli', 'Manendragarh', 'Sakti', 'Other'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Sanquelim', 'Cuncolim', 'Quepem', 'Pernem', 'Canacona', 'Aldona', 'Cortalim', 'Other'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Navsari', 'Morbi', 'Nadiad', 'Surendranagar', 'Bharuch', 'Mehsana', 'Bhuj', 'Porbandar', 'Palanpur', 'Valsad', 'Vapi', 'Gondal', 'Veraval', 'Godhra', 'Patan', 'Kalol', 'Dahod', 'Botad', 'Amreli', 'Deesa', 'Jetpur', 'Other'],
    'Haryana': ['Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Jind', 'Thanesar', 'Kaithal', 'Rewari', 'Palwal', 'Hansi', 'Narnaul', 'Fatehabad', 'Gohana', 'Tohana', 'Narwana', 'Mewat', 'Charkhi Dadri', 'Shahabad', 'Pehowa', 'Samalkha', 'Pinjore', 'Other'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Palampur', 'Kullu', 'Hamirpur', 'Baddi', 'Nahan', 'Una', 'Chamba', 'Bilaspur', 'Kangra', 'Sundernagar', 'Nalagarh', 'Nurpur', 'Manali', 'Dalhousie', 'Kasauli', 'Parwanoo', 'Other'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Medininagar', 'Phusro', 'Chaibasa', 'Dumka', 'Gumla', 'Chirkunda', 'Sahibganj', 'Jhumri Tilaiya', 'Saunda', 'Pakur', 'Simdega', 'Madhupur', 'Mihijam', 'Other'],
    'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davanagere', 'Bellary', 'Bijapur', 'Shimoga', 'Tumkur', 'Raichur', 'Bidar', 'Hospet', 'Hassan', 'Gadag', 'Udupi', 'Robertson Pet', 'Bhadravati', 'Chitradurga', 'Kolar', 'Mandya', 'Chikmagalur', 'Gangavati', 'Bagalkot', 'Ranibennur', 'Karwar', 'Other'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Malappuram', 'Kannur', 'Kottayam', 'Kasaragod', 'Thalassery', 'Ponnani', 'Vatakara', 'Kanhangad', 'Payyanur', 'Koyilandy', 'Parappanangadi', 'Kalamassery', 'Neyyattinkara', 'Tanur', 'Kayamkulam', 'Thrippunithura', 'Wadakkancherry', 'Nedumangad', 'Kondotty', 'Tirurangadi', 'Tirur', 'Panoor', 'Nileshwaram', 'Other'],
    'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Katni', 'Singrauli', 'Burhanpur', 'Khandwa', 'Morena', 'Bhind', 'Chhindwara', 'Guna', 'Shivpuri', 'Vidisha', 'Chhatarpur', 'Damoh', 'Mandsaur', 'Khargone', 'Neemuch', 'Pithampur', 'Hoshangabad', 'Itarsi', 'Sehore', 'Betul', 'Seoni', 'Datia', 'Nagda', 'Dhar', 'Other'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Navi Mumbai', 'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Jalgaon', 'Nanded', 'Sangli', 'Parbhani', 'Yavatmal', 'Satara', 'Ichalkaranji', 'Jalna', 'Malegaon', 'Bid', 'Gondia', 'Pimpri-Chinchwad', 'Panvel', 'Ulhasnagar', 'Bhiwandi', 'Ambarnath', 'Badlapur', 'Kalyan-Dombivli', 'Mira-Bhayandar', 'Vasai-Virar', 'Wardha', 'Bhandara', 'Hinganghat', 'Other'],
    'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching', 'Ukhrul', 'Senapati', 'Jiribam', 'Tamenglong', 'Moirang', 'Mayang Imphal', 'Yairipok', 'Lilong', 'Other'],
    'Meghalaya': ['Shillong', 'Tura', 'Nongstoin', 'Jowai', 'Baghmara', 'Williamnagar', 'Nongpoh', 'Mairang', 'Resubelpara', 'Cherrapunji', 'Other'],
    'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib', 'Lawngtlai', 'Saiha', 'Mamit', 'Other'],
    'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Phek', 'Mon', 'Kiphire', 'Longleng', 'Peren', 'Other'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda', 'Jeypore', 'Bargarh', 'Balangir', 'Rayagada', 'Bhawanipatna', 'Dhenkanal', 'Barbil', 'Kendujhar', 'Sunabeda', 'Jatani', 'Byasanagar', 'Paradip', 'Talcher', 'Biramitrapur', 'Bhuban', 'Deogarh', 'Phulbani', 'Other'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Batala', 'Moga', 'Malerkotla', 'Khanna', 'Muktsar', 'Barnala', 'Rajpura', 'Firozpur', 'Kapurthala', 'Faridkot', 'Sunam', 'Sangrur', 'Fazilka', 'Gurdaspur', 'Kharar', 'Gobindgarh', 'Mansa', 'Malout', 'Nabha', 'Tarn Taran', 'Jagraon', 'Budhlada', 'Rampura Phul', 'Nangal', 'Abohar', 'Other'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Alwar', 'Bhilwara', 'Bharatpur', 'Pali', 'Sri Ganganagar', 'Sikar', 'Tonk', 'Beawar', 'Hanumangarh', 'Kishangarh', 'Baran', 'Dhaulpur', 'Gangapur City', 'Sawai Madhopur', 'Churu', 'Jhunjhunu', 'Barmer', 'Hindaun', 'Karauli', 'Sujangarh', 'Sardarshahar', 'Chittorgarh', 'Nagaur', 'Makrana', 'Lachhmangarh', 'Ratangarh', 'Sadri', 'Banswara', 'Neem Ka Thana', 'Nokha', 'Dungarpur', 'Pratapgarh', 'Other'],
    'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Pakyong', 'Jorethang', 'Rangpo', 'Singtam', 'Pelling', 'Other'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Ranipet', 'Nagercoil', 'Thanjavur', 'Vellore', 'Kancheepuram', 'Erode', 'Tiruvannamalai', 'Pollachi', 'Rajapalayam', 'Sivakasi', 'Pudukkottai', 'Neyveli', 'Nagapattinam', 'Viluppuram', 'Tiruchengode', 'Vaniyambadi', 'Theni', 'Cuddalore', 'Kumbakonam', 'Tirupattur', 'Avadi', 'Pallavaram', 'Ambur', 'Tenkasi', 'Karur', 'Udhagamandalam', 'Hosur', 'Nandivaram-Guduvancheri', 'Perundurai', 'Paramakudi', 'Gudiyatham', 'Poonamallee', 'Palani', 'Sivaganga', 'Thiruvallur', 'Tindivanam', 'Virudhunagar', 'Aruppukkottai', 'Other'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Miryalaguda', 'Jagtial', 'Mancherial', 'Nirmal', 'Kamareddy', 'Kothagudem', 'Bodhan', 'Palwancha', 'Mandamarri', 'Koratla', 'Sircilla', 'Tandur', 'Siddipet', 'Wanaparthy', 'Kagaznagar', 'Gadwal', 'Sangareddy', 'Bellampalle', 'Bhainsa', 'Farooqnagar', 'Narayanpet', 'Vikarabad', 'Jangaon', 'Kyathampalle', 'Other'],
    'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailasahar', 'Bishalgarh', 'Teliamura', 'Khowai', 'Belonia', 'Melaghar', 'Mohanpur', 'Ambassa', 'Ranirbazar', 'Santirbazar', 'Kumarghat', 'Sonamura', 'Panisagar', 'Amarpur', 'Jirania', 'Kamalpur', 'Sabroom', 'Other'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Meerut', 'Varanasi', 'Allahabad', 'Noida', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Budaun', 'Rampur', 'Shahjahanpur', 'Farrukhabad', 'Maunath Bhanjan', 'Hapur', 'Ayodhya', 'Etawah', 'Mirzapur', 'Bulandshahr', 'Sambhal', 'Amroha', 'Hardoi', 'Fatehpur', 'Raebareli', 'Orai', 'Sitapur', 'Bahraich', 'Modinagar', 'Unnao', 'Jaunpur', 'Lakhimpur', 'Hathras', 'Banda', 'Pilibhit', 'Barabanki', 'Khurja', 'Gonda', 'Mainpuri', 'Lalitpur', 'Etah', 'Deoria', 'Ujhani', 'Ghazipur', 'Sultanpur', 'Azamgarh', 'Bijnor', 'Sahaswan', 'Basti', 'Chandausi', 'Akbarpur', 'Ballia', 'Tanda', 'Greater Noida', 'Shikohabad', 'Shamli', 'Awagarh', 'Kasganj', 'Other'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Ramnagar', 'Pithoragarh', 'Jaspur', 'Kotdwar', 'Nainital', 'Manglaur', 'Sitarganj', 'Pauri', 'Tehri', 'Almora', 'Udham Singh Nagar', 'Bageshwar', 'Chamoli', 'Champawat', 'Rudraprayag', 'Other'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'English Bazar', 'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Dankuni', 'Dhulian', 'Ranaghat', 'Haldia', 'Raiganj', 'Krishnanagar', 'Nabadwip', 'Medinipur', 'Jalpaiguri', 'Balurghat', 'Basirhat', 'Bankura', 'Chakdaha', 'Darjeeling', 'Alipurduar', 'Purulia', 'Jangipur', 'Bangaon', 'Cooch Behar', 'Other'],
    'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi', 'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi', 'Shahdara', 'Other'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore', 'Kathua', 'Udhampur', 'Punch', 'Rajauri', 'Other'],
    'Ladakh': ['Leh', 'Kargil', 'Nubra', 'Other'],
    'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam', 'Other'],
    'Chandigarh': ['Chandigarh'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa', 'Other'],
    'Lakshadweep': ['Kavaratti', 'Agatti', 'Andrott', 'Other'],
    'Andaman and Nicobar Islands': ['Port Blair', 'Diglipur', 'Rangat', 'Other'],
    'Other': ['Other']
  },

  'United States': {
    'California': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento', 'Fresno'],
    'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso'],
    'New York': ['New York City', 'Buffalo', 'Rochester', 'Albany', 'Syracuse'],
    'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'],
    'Illinois': ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford'],
    'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading'],
    'Ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron'],
    'Georgia': ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens'],
    'Other': ['Other']
  },

  'United Kingdom': {
    'England': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Newcastle', 'Sheffield'],
    'Scotland': ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Inverness'],
    'Wales': ['Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Barry'],
    'Northern Ireland': ['Belfast', 'Derry', 'Lisburn', 'Newry', 'Armagh'],
    'Other': ['Other']
  },

  'Canada': {
    'Ontario': ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton', 'London'],
    'Quebec': ['Montreal', 'Quebec City', 'Laval', 'Gatineau', 'Longueuil'],
    'British Columbia': ['Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Victoria'],
    'Alberta': ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'Medicine Hat'],
    'Manitoba': ['Winnipeg', 'Brandon', 'Steinbach', 'Thompson', 'Portage la Prairie'],
    'Other': ['Other']
  },

  'Australia': {
    'New South Wales': ['Sydney', 'Newcastle', 'Wollongong', 'Central Coast', 'Maitland'],
    'Victoria': ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Shepparton'],
    'Queensland': ['Brisbane', 'Gold Coast', 'Sunshine Coast', 'Townsville', 'Cairns'],
    'Western Australia': ['Perth', 'Mandurah', 'Bunbury', 'Kalgoorlie', 'Geraldton'],
    'South Australia': ['Adelaide', 'Mount Gambier', 'Whyalla', 'Murray Bridge'],
    'Other': ['Other']
  },

  'UAE': {
    'Dubai': ['Dubai City', 'Deira', 'Bur Dubai', 'Jumeirah', 'Al Barsha'],
    'Abu Dhabi': ['Abu Dhabi City', 'Al Ain', 'Ruwais', 'Khalifa City'],
    'Sharjah': ['Sharjah City', 'Kalba', 'Khor Fakkan', 'Dibba Al-Hisn'],
    'Ajman': ['Ajman City', 'Manama', 'Masfout'],
    'Other': ['Other']
  },

  'Singapore': {
    'Singapore': ['Central', 'East', 'North', 'West', 'Northeast']
  },

  'Germany': {
    'Bavaria': ['Munich', 'Nuremberg', 'Augsburg', 'Regensburg', 'Ingolstadt'],
    'Berlin': ['Berlin'],
    'Hamburg': ['Hamburg'],
    'Baden-Württemberg': ['Stuttgart', 'Mannheim', 'Karlsruhe', 'Freiburg', 'Heidelberg'],
    'Other': ['Other']
  },

  'France': {
    'Île-de-France': ['Paris', 'Versailles', 'Boulogne-Billancourt', 'Saint-Denis'],
    'Provence-Alpes-Côte d\'Azur': ['Marseille', 'Nice', 'Toulon', 'Aix-en-Provence'],
    'Auvergne-Rhône-Alpes': ['Lyon', 'Grenoble', 'Saint-Étienne', 'Villeurbanne'],
    'Other': ['Other']
  },

  // For other countries - minimal data
  'Afghanistan': {
    'Kabul': ['Kabul City'],
    'Herat': ['Herat City'],
    'Kandahar': ['Kandahar City'],
    'Balkh': ['Mazar-i-Sharif'],
    'Other': ['Other']
  },

  'Pakistan': {
    'Punjab': ['Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala'],
    'Sindh': ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana'],
    'Khyber Pakhtunkhwa': ['Peshawar', 'Mardan', 'Abbottabad', 'Kohat'],
    'Balochistan': ['Quetta', 'Gwadar', 'Turbat', 'Khuzdar'],
    'Other': ['Other']
  },

  'Bangladesh': {
    'Dhaka': ['Dhaka City', 'Narayanganj', 'Gazipur', 'Tongi'],
    'Chittagong': ['Chittagong City', 'Cox\'s Bazar', 'Comilla'],
    'Rajshahi': ['Rajshahi City', 'Bogra', 'Pabna'],
    'Other': ['Other']
  },

  'Nepal': {
    'Bagmati': ['Kathmandu', 'Lalitpur', 'Bhaktapur'],
    'Gandaki': ['Pokhara', 'Gorkha'],
    'Lumbini': ['Butwal', 'Siddharthanagar'],
    'Other': ['Other']
  },

  'Sri Lanka': {
    'Western': ['Colombo', 'Gampaha', 'Kalutara'],
    'Central': ['Kandy', 'Matale', 'Nuwara Eliya'],
    'Southern': ['Galle', 'Matara', 'Hambantota'],
    'Other': ['Other']
  },

  'China': {
    'Beijing': ['Beijing'],
    'Shanghai': ['Shanghai'],
    'Guangdong': ['Guangzhou', 'Shenzhen', 'Dongguan'],
    'Zhejiang': ['Hangzhou', 'Ningbo', 'Wenzhou'],
    'Other': ['Other']
  },

  'Japan': {
    'Tokyo': ['Tokyo'],
    'Osaka': ['Osaka', 'Sakai', 'Higashiosaka'],
    'Kanagawa': ['Yokohama', 'Kawasaki', 'Sagamihara'],
    'Other': ['Other']
  },

  'South Korea': {
    'Seoul': ['Seoul'],
    'Busan': ['Busan'],
    'Incheon': ['Incheon'],
    'Gyeonggi': ['Suwon', 'Seongnam', 'Goyang'],
    'Other': ['Other']
  },

  'Brazil': {
    'São Paulo': ['São Paulo', 'Campinas', 'Santos', 'Sorocaba'],
    'Rio de Janeiro': ['Rio de Janeiro', 'Niterói', 'Duque de Caxias'],
    'Minas Gerais': ['Belo Horizonte', 'Uberlândia', 'Contagem'],
    'Other': ['Other']
  },

  'Mexico': {
    'Mexico City': ['Mexico City'],
    'Jalisco': ['Guadalajara', 'Zapopan', 'Tlaquepaque'],
    'Nuevo León': ['Monterrey', 'San Nicolás de los Garza'],
    'Other': ['Other']
  },

  'South Africa': {
    'Gauteng': ['Johannesburg', 'Pretoria', 'Soweto', 'Benoni'],
    'Western Cape': ['Cape Town', 'Stellenbosch', 'Paarl'],
    'KwaZulu-Natal': ['Durban', 'Pietermaritzburg', 'Richards Bay'],
    'Other': ['Other']
  },

  'Nigeria': {
    'Lagos': ['Lagos', 'Ikeja', 'Epe'],
    'Kano': ['Kano City'],
    'Rivers': ['Port Harcourt'],
    'Abuja': ['Abuja'],
    'Other': ['Other']
  },

  'Kenya': {
    'Nairobi': ['Nairobi'],
    'Mombasa': ['Mombasa'],
    'Kisumu': ['Kisumu'],
    'Nakuru': ['Nakuru'],
    'Other': ['Other']
  },

  'Egypt': {
    'Cairo': ['Cairo', 'Giza', 'Helwan'],
    'Alexandria': ['Alexandria'],
    'Giza': ['Giza', '6th of October City'],
    'Other': ['Other']
  },

  'Saudi Arabia': {
    'Riyadh': ['Riyadh'],
    'Makkah': ['Jeddah', 'Mecca', 'Taif'],
    'Eastern Province': ['Dammam', 'Dhahran', 'Al Khobar'],
    'Other': ['Other']
  },

  'Turkey': {
    'Istanbul': ['Istanbul'],
    'Ankara': ['Ankara'],
    'İzmir': ['İzmir'],
    'Antalya': ['Antalya'],
    'Other': ['Other']
  },

  'Indonesia': {
    'Jakarta': ['Jakarta'],
    'West Java': ['Bandung', 'Bekasi', 'Depok', 'Bogor'],
    'East Java': ['Surabaya', 'Malang', 'Surakarta'],
    'Bali': ['Denpasar', 'Ubud'],
    'Other': ['Other']
  },

  'Malaysia': {
    'Kuala Lumpur': ['Kuala Lumpur'],
    'Selangor': ['Petaling Jaya', 'Shah Alam', 'Subang Jaya'],
    'Johor': ['Johor Bahru', 'Iskandar Puteri'],
    'Penang': ['George Town', 'Butterworth'],
    'Other': ['Other']
  },

  'Thailand': {
    'Bangkok': ['Bangkok'],
    'Chiang Mai': ['Chiang Mai'],
    'Phuket': ['Phuket City'],
    'Other': ['Other']
  },

  'Vietnam': {
    'Hanoi': ['Hanoi'],
    'Ho Chi Minh City': ['Ho Chi Minh City'],
    'Da Nang': ['Da Nang'],
    'Other': ['Other']
  },

  'Philippines': {
    'Metro Manila': ['Manila', 'Quezon City', 'Makati', 'Pasig'],
    'Cebu': ['Cebu City', 'Mandaue', 'Lapu-Lapu'],
    'Davao': ['Davao City'],
    'Other': ['Other']
  },

  'Russia': {
    'Moscow': ['Moscow'],
    'Saint Petersburg': ['Saint Petersburg'],
    'Novosibirsk': ['Novosibirsk'],
    'Other': ['Other']
  },

  'Poland': {
    'Masovian': ['Warsaw'],
    'Lesser Poland': ['Kraków'],
    'Greater Poland': ['Poznań'],
    'Other': ['Other']
  },

  'Spain': {
    'Madrid': ['Madrid'],
    'Catalonia': ['Barcelona', 'Hospitalet de Llobregat'],
    'Andalusia': ['Seville', 'Málaga', 'Córdoba'],
    'Other': ['Other']
  },

  'Italy': {
    'Lazio': ['Rome'],
    'Lombardy': ['Milan', 'Brescia', 'Monza'],
    'Campania': ['Naples', 'Salerno'],
    'Other': ['Other']
  },

  'Netherlands': {
    'North Holland': ['Amsterdam', 'Haarlem'],
    'South Holland': ['Rotterdam', 'The Hague', 'Leiden'],
    'Utrecht': ['Utrecht'],
    'Other': ['Other']
  },

  'Belgium': {
    'Brussels': ['Brussels'],
    'Flemish Brabant': ['Leuven', 'Mechelen'],
    'Antwerp': ['Antwerp'],
    'Other': ['Other']
  },

  'Switzerland': {
    'Zürich': ['Zürich'],
    'Geneva': ['Geneva'],
    'Bern': ['Bern'],
    'Other': ['Other']
  },

  'Austria': {
    'Vienna': ['Vienna'],
    'Lower Austria': ['St. Pölten', 'Wiener Neustadt'],
    'Upper Austria': ['Linz', 'Wels'],
    'Other': ['Other']
  },

  'Sweden': {
    'Stockholm': ['Stockholm'],
    'Västra Götaland': ['Gothenburg', 'Borås'],
    'Skåne': ['Malmö', 'Helsingborg'],
    'Other': ['Other']
  },

  'Norway': {
    'Oslo': ['Oslo'],
    'Viken': ['Bærum', 'Drammen'],
    'Vestland': ['Bergen'],
    'Other': ['Other']
  },

  'Denmark': {
    'Capital Region': ['Copenhagen'],
    'Central Denmark': ['Aarhus'],
    'Southern Denmark': ['Odense'],
    'Other': ['Other']
  },

  'Finland': {
    'Uusimaa': ['Helsinki', 'Espoo', 'Vantaa'],
    'Pirkanmaa': ['Tampere'],
    'Southwest Finland': ['Turku'],
    'Other': ['Other']
  },

  'Greece': {
    'Attica': ['Athens', 'Piraeus'],
    'Central Macedonia': ['Thessaloniki'],
    'Crete': ['Heraklion', 'Chania'],
    'Other': ['Other']
  },

  'Portugal': {
    'Lisbon': ['Lisbon'],
    'Porto': ['Porto'],
    'Faro': ['Faro'],
    'Other': ['Other']
  },

  'Ireland': {
    'Dublin': ['Dublin'],
    'Cork': ['Cork'],
    'Galway': ['Galway'],
    'Other': ['Other']
  },

  'New Zealand': {
    'Auckland': ['Auckland'],
    'Wellington': ['Wellington'],
    'Canterbury': ['Christchurch'],
    'Other': ['Other']
  },

  'Argentina': {
    'Buenos Aires': ['Buenos Aires'],
    'Córdoba': ['Córdoba'],
    'Santa Fe': ['Rosario', 'Santa Fe'],
    'Other': ['Other']
  },

  'Chile': {
    'Santiago Metropolitan': ['Santiago'],
    'Valparaíso': ['Valparaíso', 'Viña del Mar'],
    'Other': ['Other']
  },

  'Colombia': {
    'Bogotá': ['Bogotá'],
    'Antioquia': ['Medellín'],
    'Valle del Cauca': ['Cali'],
    'Other': ['Other']
  },

  'Israel': {
    'Tel Aviv': ['Tel Aviv'],
    'Jerusalem': ['Jerusalem'],
    'Haifa': ['Haifa'],
    'Other': ['Other']
  },

  'Iran': {
    'Tehran': ['Tehran'],
    'Isfahan': ['Isfahan'],
    'Mashhad': ['Mashhad'],
    'Other': ['Other']
  },

  'Iraq': {
    'Baghdad': ['Baghdad'],
    'Basra': ['Basra'],
    'Mosul': ['Mosul'],
    'Other': ['Other']
  },

  'Jordan': {
    'Amman': ['Amman'],
    'Zarqa': ['Zarqa'],
    'Irbid': ['Irbid'],
    'Other': ['Other']
  },

  'Kuwait': {
    'Al Asimah': ['Kuwait City'],
    'Hawalli': ['Hawalli'],
    'Other': ['Other']
  },

  'Oman': {
    'Muscat': ['Muscat'],
    'Dhofar': ['Salalah'],
    'Other': ['Other']
  },

  'Qatar': {
    'Ad Dawhah': ['Doha'],
    'Al Rayyan': ['Al Rayyan'],
    'Other': ['Other']
  },

  'Bahrain': {
    'Capital': ['Manama'],
    'Muharraq': ['Muharraq'],
    'Other': ['Other']
  },

  'Ukraine': {
    'Kyiv': ['Kyiv'],
    'Kharkiv': ['Kharkiv'],
    'Odesa': ['Odesa'],
    'Other': ['Other']
  },

  'Albania': {
    'Tirana': ['Tirana'],
    'Other': ['Other']
  },

  'Algeria': {
    'Algiers': ['Algiers'],
    'Oran': ['Oran'],
    'Other': ['Other']
  },

  'Taiwan': {
    'Taipei': ['Taipei'],
    'Kaohsiung': ['Kaohsiung'],
    'Taichung': ['Taichung'],
    'Other': ['Other']
  },

  'Hong Kong': {
    'Hong Kong Island': ['Central', 'Wan Chai'],
    'Kowloon': ['Tsim Sha Tsui', 'Mong Kok'],
    'New Territories': ['Sha Tin', 'Tuen Mun'],
    'Other': ['Other']
  }
};

// Get states for a country
export const getStates = (country) => {
  if (!country || !LOCATION_DATA[country]) return [];
  return Object.keys(LOCATION_DATA[country]);
};

// Get cities for a state in a country
export const getCities = (country, state) => {
  if (!country || !state || !LOCATION_DATA[country] || !LOCATION_DATA[country][state]) return [];
  return LOCATION_DATA[country][state];
};
