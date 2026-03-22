from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1080, 608
BG = (245, 247, 250)
BLUE = (37, 99, 235)
BLUE2 = (29, 78, 216)
WHITE = (255, 255, 255)
RED = (239, 68, 68)
AMBER = (245, 158, 11)
GREEN = (16, 185, 129)
SLATE = (100, 116, 139)
ORANGE = (249, 115, 22)
SKY = (14, 165, 233)
INDIGO = (99, 102, 241)
DARK = (30, 41, 59)

def load_font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc" if bold else "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/AppleSDGothicNeo.ttc",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except:
                pass
    return ImageFont.load_default()

def draw_rounded_rect(draw, xy, radius, fill, outline=None, width=1):
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill,
                            outline=outline, width=width)

def draw_header(draw, title, subtitle):
    draw.rectangle([0, 0, W, 64], fill=BLUE)
    f_title = load_font(22, bold=True)
    f_sub = load_font(12)
    draw.text((24, 12), title, font=f_title, fill=WHITE)
    draw.text((24, 42), subtitle, font=f_sub, fill=(147, 197, 253))

def draw_badge(draw, x, y, text, color, text_color=WHITE, radius=12):
    f = load_font(12, bold=True)
    bbox = f.getbbox(text)
    tw = bbox[2] - bbox[0]
    pad = 10
    draw_rounded_rect(draw, [x, y, x + tw + pad*2, y + 24], radius=radius, fill=color)
    draw.text((x + pad, y + 4), text, font=f, fill=text_color)
    return x + tw + pad*2 + 6

def draw_card(draw, x, y, w, h, priority=None, category=None, content="", author="", shift=None, actions=True):
    border = (254, 202, 202) if priority == "高" else (226, 232, 240)
    draw_rounded_rect(draw, [x, y, x+w, y+h], radius=12, fill=WHITE, outline=border, width=2 if priority == "高" else 1)
    cx = x + 16
    cy = y + 14
    if category:
        cx = draw_badge(draw, cx, cy, category, (239, 246, 255), (37, 99, 235))
    if priority:
        colors = {"高": RED, "中": AMBER, "低": SLATE}
        cx = draw_badge(draw, cx, cy, priority, colors.get(priority, SLATE))
    if shift:
        sc = {"朝": ORANGE, "昼": SKY, "夜": INDIGO}
        draw_badge(draw, x+w-80, cy, shift+"シフト", sc.get(shift, SLATE))
    f_content = load_font(14)
    draw.text((x+16, y+44), content, font=f_content, fill=DARK)
    f_small = load_font(11)
    if author:
        draw.text((x+16, y+h-36), f"記入: {author}", font=f_small, fill=SLATE)
    if actions:
        btn_y = y + h - 28
        for label, color in [("編集", (241,245,249)), ("複製", (241,245,249)), ("アーカイブ", (241,245,249)), ("削除", (241,245,249))]:
            fb = load_font(11)
            bbox = fb.getbbox(label)
            bw = bbox[2] - bbox[0] + 16
            draw_rounded_rect(draw, [x+16, btn_y, x+16+bw, btn_y+20], radius=6, fill=color)
            draw.text((x+24, btn_y+4), label, font=fb, fill=SLATE)
            x += bw + 8

def make_frame(slide_fn):
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    slide_fn(img, draw)
    return img

# -------- スライド定義 --------

def slide_title(img, draw):
    draw.rectangle([0, 0, W, H], fill=BLUE)
    # グラデーション風に少し暗く
    draw.rectangle([0, H//2, W, H], fill=BLUE2)
    f1 = load_font(52, bold=True)
    f2 = load_font(22)
    f3 = load_font(16)
    draw.text((W//2, H//2 - 60), "ツナグ", font=f1, fill=WHITE, anchor="mm")
    draw.text((W//2, H//2 + 10), "工場引き継ぎメモアプリ", font=f2, fill=(147, 197, 253), anchor="mm")
    draw.text((W//2, H//2 + 60), "紙・LINEの引き継ぎをデジタル化", font=f3, fill=(186, 230, 253), anchor="mm")

def slide_main(img, draw):
    draw_header(draw, "ツナグ", "工場引き継ぎメモアプリ")
    f = load_font(13, bold=True)
    draw_badge(draw, W-130, 20, "未確認 2件", WHITE, BLUE)
    # アラート
    draw_rounded_rect(draw, [40, 80, W-40, 112], radius=8, fill=(255, 241, 242), outline=(254, 202, 202))
    draw.text((60, 90), "⚠ 重要度「高」の未確認が 1 件あります", font=load_font(13), fill=(185, 28, 28))
    # 日付行
    draw.text((40, 124), "2026/03/22", font=load_font(13), fill=SLATE)
    draw_rounded_rect(draw, [W-160, 118, W-40, 142], radius=8, fill=BLUE)
    draw.text((W-128, 124), "＋ 新規登録", font=load_font(13, bold=True), fill=WHITE)
    # カテゴリ
    cats = ["すべて", "電気", "設備", "部品", "安全"]
    cx = 40
    for i, c in enumerate(cats):
        col = BLUE if i == 0 else WHITE
        tc = WHITE if i == 0 else SLATE
        fb = load_font(12)
        bbox = fb.getbbox(c)
        bw = bbox[2] - bbox[0] + 16
        draw_rounded_rect(draw, [cx, 152, cx+bw, 172], radius=10, fill=col, outline=(203,213,225))
        draw.text((cx+8, 156), c, font=fb, fill=tc)
        cx += bw + 6
    # シフトフィルター
    shifts = ["全シフト", "朝シフト", "昼シフト", "夜シフト"]
    cx = 40
    for i, s in enumerate(shifts):
        col = DARK if i == 0 else WHITE
        tc = WHITE if i == 0 else SLATE
        fb = load_font(12)
        bbox = fb.getbbox(s)
        bw = bbox[2] - bbox[0] + 16
        draw_rounded_rect(draw, [cx, 180, cx+bw, 200], radius=10, fill=col, outline=(203,213,225))
        draw.text((cx+8, 184), s, font=fb, fill=tc)
        cx += bw + 6
    # 朝シフトラベル
    draw_rounded_rect(draw, [40, 214, 120, 234], radius=10, fill=(255, 237, 213))
    draw.text((52, 218), "朝シフト  2件", font=load_font(12), fill=ORANGE)
    # カード1
    draw_card(draw, 40, 244, W-80, 90, "中", "部品", "欠品しているものがあるので確認してください", "小川", "朝")
    # カード2
    draw_card(draw, 40, 344, W-80, 90, "高", "設備", "機械に少し異常があったので確認してください", "小川", "朝")

def slide_shift(img, draw):
    draw_header(draw, "ツナグ", "シフト別に自動グループ化")
    draw.text((40, 80), "シフトごとに引き継ぎを整理。どの時間帯の情報か一目で分かる。", font=load_font(14), fill=DARK)
    # 朝シフト
    draw_rounded_rect(draw, [40, 116, 140, 136], radius=10, fill=(255, 237, 213))
    draw.text((52, 120), "朝シフト  2件", font=load_font(12), fill=ORANGE)
    draw_card(draw, 40, 146, (W-100)//2, 80, "高", "設備", "ポンプから異音あり", "田中", None, False)
    draw_card(draw, 40 + (W-100)//2 + 20, 146, (W-100)//2, 80, "中", "安全", "床の油汚れ要清掃", "鈴木", None, False)
    # 昼シフト
    draw_rounded_rect(draw, [40, 246, 140, 266], radius=10, fill=(224, 242, 254))
    draw.text((52, 250), "昼シフト  1件", font=load_font(12), fill=SKY)
    draw_card(draw, 40, 276, (W-100)//2, 80, "中", "品質", "検査ラインの速度調整済み", "佐藤", None, False)
    # 夜シフト
    draw_rounded_rect(draw, [40, 376, 140, 396], radius=10, fill=(238, 242, 255))
    draw.text((52, 380), "夜シフト  1件", font=load_font(12), fill=INDIGO)
    draw_card(draw, 40, 406, (W-100)//2, 80, "低", "その他", "資材補充の確認をお願いします", "山田", None, False)
    # シフト選択説明
    draw_rounded_rect(draw, [W//2+20, 246, W-40, 490], radius=12, fill=WHITE, outline=(203,213,225))
    draw.text((W//2+36, 262), "シフトで絞り込みも可能", font=load_font(14, bold=True), fill=DARK)
    shifts = [("朝", ORANGE), ("昼", SKY), ("夜", INDIGO)]
    sy = 300
    for label, color in shifts:
        draw_rounded_rect(draw, [W//2+36, sy, W//2+200, sy+36], radius=18, fill=color)
        draw.text((W//2+36+70, sy+10), f"{label}シフト", font=load_font(14, bold=True), fill=WHITE, anchor="mm")
        sy += 52

def slide_new(img, draw):
    draw_header(draw, "ツナグ", "新規引き継ぎ登録")
    draw.text((40, 80), "かんたん操作で素早く登録できる", font=load_font(14), fill=DARK)
    # 記入者
    draw_rounded_rect(draw, [40, 110, W-40, 170], radius=12, fill=WHITE, outline=(226,232,240))
    draw.text((56, 118), "記入者", font=load_font(13, bold=True), fill=DARK)
    names = ["田中", "鈴木", "佐藤", "小川"]
    nx = 56
    for n in names:
        col = BLUE if n == "小川" else WHITE
        tc = WHITE if n == "小川" else SLATE
        fb = load_font(13)
        draw_rounded_rect(draw, [nx, 138, nx+60, 158], radius=8, fill=col, outline=(203,213,225))
        draw.text((nx+30, 148), n, font=fb, fill=tc, anchor="mm")
        nx += 68
    # シフト
    draw_rounded_rect(draw, [40, 178, W-40, 230], radius=12, fill=WHITE, outline=(226,232,240))
    draw.text((56, 186), "シフト（現在時刻から自動選択）", font=load_font(13, bold=True), fill=DARK)
    for i, (label, color) in enumerate([("朝", ORANGE), ("昼", SKY), ("夜", INDIGO)]):
        alpha = 255 if i == 0 else 100
        draw_rounded_rect(draw, [56 + i*80, 206, 56+i*80+64, 222], radius=11, fill=color)
        draw.text((56+i*80+32, 214), label, font=load_font(13, bold=True), fill=WHITE, anchor="mm")
    # カテゴリ
    draw_rounded_rect(draw, [40, 238, W-40, 290], radius=12, fill=WHITE, outline=(226,232,240))
    draw.text((56, 246), "カテゴリ", font=load_font(13, bold=True), fill=DARK)
    cats2 = [("電気", True), ("設備", False), ("部品", False), ("安全", False)]
    cx2 = 56
    for label, sel in cats2:
        col = BLUE if sel else WHITE
        tc = WHITE if sel else SLATE
        fb = load_font(13)
        draw_rounded_rect(draw, [cx2, 264, cx2+54, 280], radius=10, fill=col, outline=(203,213,225))
        draw.text((cx2+27, 272), label, font=fb, fill=tc, anchor="mm")
        cx2 += 62
    # 重要度
    draw_rounded_rect(draw, [40, 298, W-40, 345], radius=12, fill=WHITE, outline=(226,232,240))
    draw.text((56, 306), "重要度", font=load_font(13, bold=True), fill=DARK)
    for i, (label, color) in enumerate([(("高"), RED), ("中", AMBER), ("低", SLATE)]):
        draw_rounded_rect(draw, [56+i*80, 320, 56+i*80+64, 336], radius=11, fill=color)
        draw.text((56+i*80+32, 328), label, font=load_font(13, bold=True), fill=WHITE, anchor="mm")

def slide_ai(img, draw):
    draw_header(draw, "ツナグ", "✨ AI文章自動生成")
    draw.text((40, 80), "キーワードを入力するだけ。AIが引き継ぎ文章を自動作成。", font=load_font(14), fill=DARK)
    # AI入力エリア
    draw_rounded_rect(draw, [40, 110, W-40, 300], radius=12, fill=(239, 246, 255), outline=(191, 219, 254))
    draw.text((56, 122), "✨ AIで文章を自動生成", font=load_font(13, bold=True), fill=BLUE)
    # キーワード入力
    draw_rounded_rect(draw, [56, 146, W-120, 172], radius=8, fill=WHITE, outline=(191, 219, 254))
    draw.text((70, 153), "ポンプ 異音 3番ライン", font=load_font(13), fill=DARK)
    draw_rounded_rect(draw, [W-112, 146, W-56, 172], radius=8, fill=BLUE)
    draw.text((W-84, 159), "AI生成", font=load_font(13, bold=True), fill=WHITE, anchor="mm")
    # 生成結果
    draw_rounded_rect(draw, [56, 182, W-56, 290], radius=8, fill=WHITE, outline=(191, 219, 254))
    lines = [
        "3番ラインのポンプから異音が発生しています。",
        "点検を実施し、必要に応じて部品交換を",
        "検討してください。夜間シフトでも継続",
        "して状況を確認してください。",
    ]
    for i, line in enumerate(lines):
        draw.text((70, 196 + i*22), line, font=load_font(13), fill=DARK)
    # 過去候補
    draw_rounded_rect(draw, [40, 310, W-40, 490], radius=12, fill=WHITE, outline=(226,232,240))
    draw.text((56, 320), "📋 過去の似た引き継ぎ（タップで入力）", font=load_font(13, bold=True), fill=SLATE)
    past = [
        "3番ラインのポンプから異音あり。夜間も確認してください...",
        "2番ラインポンプの異音について要確認。部品交換済みです...",
    ]
    for i, p in enumerate(past):
        py = 346 + i*60
        draw_rounded_rect(draw, [56, py, W-56, py+48], radius=8, fill=(248, 250, 252), outline=(226,232,240))
        draw.text((70, py+14), p, font=load_font(12), fill=SLATE)

def slide_image(img, draw):
    draw_header(draw, "ツナグ", "📷 画像添付機能")
    draw.text((40, 80), "設備の異常箇所をスマホで撮影してそのまま添付。", font=load_font(14), fill=DARK)
    # 画像添付エリア
    draw_rounded_rect(draw, [40, 110, W-40, 200], radius=12, fill=WHITE, outline=(226,232,240))
    draw.text((56, 122), "📷 画像添付（任意）", font=load_font(14, bold=True), fill=DARK)
    draw_rounded_rect(draw, [56, 148, 156, 174], radius=8, fill=(241, 245, 249))
    draw.text((106, 161), "写真を選ぶ", font=load_font(13), fill=SLATE, anchor="mm")
    draw.text((170, 161), "設備の写真などを添付できます", font=load_font(12), fill=(148, 163, 184))
    # サンプル画像エリア（モック）
    draw_rounded_rect(draw, [40, 214, W//2-20, 450], radius=12, fill=WHITE, outline=(226,232,240))
    draw.text((56, 226), "添付した画像はカードに表示", font=load_font(13, bold=True), fill=DARK)
    # 画像プレースホルダー
    draw_rounded_rect(draw, [56, 254, W//2-36, 420], radius=8, fill=(241, 245, 249), outline=(203, 213, 225))
    draw.text(((56 + W//2-36)//2, 337), "📷", font=load_font(48), fill=(148, 163, 184), anchor="mm")
    draw.text(((56 + W//2-36)//2, 400), "設備の写真", font=load_font(13), fill=(148, 163, 184), anchor="mm")
    # 説明
    draw_rounded_rect(draw, [W//2+20, 214, W-40, 450], radius=12, fill=WHITE, outline=(226,232,240))
    points = [
        "スマホカメラで直接撮影可能",
        "カメラロールからも選択できる",
        "画像をタップで拡大表示",
        "登録前にプレビューで確認",
    ]
    draw.text((W//2+36, 226), "ポイント", font=load_font(14, bold=True), fill=BLUE)
    for i, p in enumerate(points):
        draw.text((W//2+50, 264 + i*44), f"✓ {p}", font=load_font(13), fill=DARK)

def slide_copy(img, draw):
    draw_header(draw, "ツナグ", "複製・コメント・アーカイブ")
    draw.text((40, 80), "現場で使いやすい便利機能が揃っています。", font=load_font(14), fill=DARK)
    # 引き継ぎカード（複製ボタン強調）
    draw_rounded_rect(draw, [40, 110, W-40, 230], radius=12, fill=WHITE, outline=(226,232,240))
    draw_badge(draw, 56, 122, "設備", (239, 246, 255), BLUE)
    draw_badge(draw, 108, 122, "高", RED)
    draw.text((56, 152), "3番ラインのポンプから異音が発生しています。", font=load_font(14), fill=DARK)
    draw.text((56, 178), "記入: 田中", font=load_font(12), fill=SLATE)
    btns = [("編集", (241,245,249), SLATE), ("複製", (220,252,231), (22,163,74)), ("アーカイブ", (241,245,249), SLATE), ("削除", (241,245,249), SLATE)]
    bx = 56
    for label, bg, tc in btns:
        fb = load_font(12)
        bbox = fb.getbbox(label)
        bw = bbox[2] - bbox[0] + 16
        draw_rounded_rect(draw, [bx, 198, bx+bw, 218], radius=6, fill=bg)
        draw.text((bx+8, 202), label, font=fb, fill=tc)
        bx += bw + 8
    # 複製説明
    draw_rounded_rect(draw, [40, 244, (W-100)//2+40, 370], radius=12, fill=WHITE, outline=(209, 250, 229))
    draw.text((56, 256), "📋 複製機能", font=load_font(14, bold=True), fill=(22, 163, 74))
    draw.text((56, 284), "同じ内容の引き継ぎを", font=load_font(13), fill=DARK)
    draw.text((56, 306), "ワンタップで複製。", font=load_font(13), fill=DARK)
    draw.text((56, 328), "毎日の繰り返し作業に便利。", font=load_font(13), fill=DARK)
    # コメント説明
    draw_rounded_rect(draw, [(W-100)//2+60, 244, W-40, 370], radius=12, fill=WHITE, outline=(219, 234, 254))
    draw.text(((W-100)//2+76, 256), "💬 コメント機能", font=load_font(14, bold=True), fill=BLUE)
    draw.text(((W-100)//2+76, 284), "引き継ぎへの追記・", font=load_font(13), fill=DARK)
    draw.text(((W-100)//2+76, 306), "質問がカードに残る。", font=load_font(13), fill=DARK)
    draw.text(((W-100)//2+76, 328), "対応状況を共有できる。", font=load_font(13), fill=DARK)
    # アーカイブ説明
    draw_rounded_rect(draw, [40, 384, (W-100)//2+40, 490], radius=12, fill=WHITE, outline=(254, 243, 199))
    draw.text((56, 396), "📦 アーカイブ機能", font=load_font(14, bold=True), fill=AMBER)
    draw.text((56, 424), "対応済みの引き継ぎを", font=load_font(13), fill=DARK)
    draw.text((56, 446), "非表示に。削除せず保管。", font=load_font(13), fill=DARK)

def slide_search(img, draw):
    draw_header(draw, "ツナグ", "検索・絞り込み・CSV出力")
    draw.text((40, 80), "4つのフィルターで必要な情報にすぐアクセス。", font=load_font(14), fill=DARK)
    # 検索エリア
    draw_rounded_rect(draw, [40, 110, W-40, 230], radius=12, fill=WHITE, outline=(226,232,240))
    draw.text((56, 120), "🔍 検索・絞り込み", font=load_font(14, bold=True), fill=DARK)
    draw_rounded_rect(draw, [56, 144, W-160, 168], radius=8, fill=(248, 250, 252), outline=(203,213,225))
    draw.text((70, 150), "キーワードで検索...", font=load_font(13), fill=(148, 163, 184))
    draw_rounded_rect(draw, [W-152, 144, W-56, 168], radius=8, fill=(248, 250, 252), outline=(203,213,225))
    draw.text((W-104, 156), "2026/03/22", font=load_font(12), fill=DARK, anchor="mm")
    names3 = ["全員", "田中", "鈴木", "佐藤"]
    nx2 = 56
    for i, n in enumerate(names3):
        col = BLUE if i == 0 else WHITE
        tc = WHITE if i == 0 else SLATE
        fb = load_font(12)
        bbox = fb.getbbox(n)
        bw = bbox[2] - bbox[0] + 14
        draw_rounded_rect(draw, [nx2, 178, nx2+bw, 196], radius=10, fill=col, outline=(203,213,225))
        draw.text((nx2+7, 182), n, font=fb, fill=tc)
        nx2 += bw + 8
    # CSV出力
    draw_rounded_rect(draw, [40, 244, W//2-20, 380], radius=12, fill=WHITE, outline=(226,232,240))
    draw.text((56, 256), "📊 CSVダウンロード", font=load_font(14, bold=True), fill=DARK)
    draw.text((56, 284), "Excelで開けるCSV形式で", font=load_font(13), fill=DARK)
    draw.text((56, 306), "当日の引き継ぎ一覧を出力。", font=load_font(13), fill=DARK)
    draw.text((56, 328), "日報・報告書作成に活用可能。", font=load_font(13), fill=DARK)
    # 過去履歴
    draw_rounded_rect(draw, [W//2+20, 244, W-40, 380], radius=12, fill=WHITE, outline=(226,232,240))
    draw.text((W//2+36, 256), "📅 過去の履歴閲覧", font=load_font(14, bold=True), fill=DARK)
    draw.text((W//2+36, 284), "日付ごとの引き継ぎを", font=load_font(13), fill=DARK)
    draw.text((W//2+36, 306), "いつでも確認できる。", font=load_font(13), fill=DARK)
    draw.text((W//2+36, 328), "確認件数も一目でわかる。", font=load_font(13), fill=DARK)
    # スマホ対応
    draw_rounded_rect(draw, [40, 394, W-40, 490], radius=12, fill=(239, 246, 255), outline=(191, 219, 254))
    draw.text((56, 406), "📱 スマートフォン・PC どちらでも使えます", font=load_font(14, bold=True), fill=BLUE)
    draw.text((56, 434), "ブラウザでURLを開くだけ。ホーム画面に追加するとアプリのように使えます。", font=load_font(12), fill=DARK)

def slide_qr(img, draw):
    draw.rectangle([0, 0, W, H], fill=BLUE)
    draw.rectangle([0, H//2, W, H], fill=BLUE2)
    f1 = load_font(36, bold=True)
    f2 = load_font(18)
    f3 = load_font(14)
    draw.text((W//2, 60), "ツナグ", font=f1, fill=WHITE, anchor="mm")
    draw.text((W//2, 100), "工場引き継ぎメモアプリ", font=f2, fill=(147, 197, 253), anchor="mm")
    # QRコード読み込み
    qr_path = "/Users/oga/Desktop/tsunagu/tsunagu_qr.png"
    if os.path.exists(qr_path):
        qr_img = Image.open(qr_path).convert("RGB").resize((180, 180))
        img.paste(qr_img, (W//2-90, H//2-80))
    draw.text((W//2, H//2+120), "tsunagu-iota.vercel.app", font=f3, fill=(186, 230, 253), anchor="mm")
    draw.text((W//2, H//2+148), "QRコードを読み込むとすぐ使えます", font=f3, fill=(147, 197, 253), anchor="mm")
    # 機能リスト
    features = ["シフト別管理", "AI文章生成", "画像添付", "複製・コメント"]
    fx = W//2 - (len(features)*110)//2
    for feat in features:
        draw_rounded_rect(draw, [fx, H-70, fx+100, H-44], radius=8, fill=(29, 78, 216))
        draw.text((fx+50, H-57), feat, font=load_font(11, bold=True), fill=WHITE, anchor="mm")
        fx += 110

# -------- フレーム生成 --------
slides_60 = [
    (slide_title, 3),
    (slide_main, 7),
    (slide_shift, 8),
    (slide_new, 8),
    (slide_ai, 10),
    (slide_image, 8),
    (slide_copy, 8),
    (slide_search, 8),
    (slide_qr, 4),
]

slides_30 = [
    (slide_title, 2),
    (slide_main, 5),
    (slide_shift, 5),
    (slide_ai, 6),
    (slide_copy, 6),
    (slide_qr, 3),
]

def build_gif(slides, fps=10, output_path="demo.gif"):
    frames = []
    durations = []
    for fn, secs in slides:
        img = make_frame(fn)
        n = max(1, int(secs * fps))
        for _ in range(n):
            frames.append(img.copy())
            durations.append(int(1000 / fps))
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        loop=0,
        duration=durations,
        optimize=False,
    )
    print(f"完了: {output_path} ({len(frames)}フレーム)")

print("1分バージョン生成中...")
build_gif(slides_60, fps=5, output_path="/Users/oga/Desktop/tsunagu/demo_60s.gif")

print("30秒バージョン生成中...")
build_gif(slides_30, fps=5, output_path="/Users/oga/Desktop/tsunagu/demo_30s.gif")

print("全て完了!")
