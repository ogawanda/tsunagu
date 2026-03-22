from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

# 日本語フォント登録
pdfmetrics.registerFont(UnicodeCIDFont('HeiseiKakuGo-W5'))
pdfmetrics.registerFont(UnicodeCIDFont('HeiseiMin-W3'))

FONT = 'HeiseiKakuGo-W5'

# スタイル定義
def make_styles():
    return {
        'cover_title': ParagraphStyle('cover_title', fontName=FONT, fontSize=28, leading=40, textColor=colors.HexColor('#1d4ed8'), spaceAfter=8),
        'cover_sub': ParagraphStyle('cover_sub', fontName=FONT, fontSize=14, leading=20, textColor=colors.HexColor('#64748b'), spaceAfter=4),
        'cover_meta': ParagraphStyle('cover_meta', fontName=FONT, fontSize=11, leading=16, textColor=colors.HexColor('#94a3b8')),
        'h1': ParagraphStyle('h1', fontName=FONT, fontSize=18, leading=26, textColor=colors.HexColor('#1e293b'), spaceBefore=20, spaceAfter=8, borderPadding=(0,0,4,0)),
        'h2': ParagraphStyle('h2', fontName=FONT, fontSize=14, leading=20, textColor=colors.HexColor('#1d4ed8'), spaceBefore=16, spaceAfter=6),
        'h3': ParagraphStyle('h3', fontName=FONT, fontSize=12, leading=18, textColor=colors.HexColor('#334155'), spaceBefore=12, spaceAfter=4),
        'body': ParagraphStyle('body', fontName=FONT, fontSize=10, leading=17, textColor=colors.HexColor('#1e293b'), spaceAfter=4),
        'bullet': ParagraphStyle('bullet', fontName=FONT, fontSize=10, leading=16, textColor=colors.HexColor('#1e293b'), leftIndent=16, spaceAfter=3),
        'note': ParagraphStyle('note', fontName=FONT, fontSize=9, leading=15, textColor=colors.HexColor('#92400e'), backColor=colors.HexColor('#fef3c7'), borderPadding=6, leftIndent=8, spaceAfter=6),
        'code_block': ParagraphStyle('code_block', fontName=FONT, fontSize=9, leading=14, textColor=colors.HexColor('#334155'), backColor=colors.HexColor('#f1f5f9'), borderPadding=8, leftIndent=8, spaceAfter=8),
        'toc': ParagraphStyle('toc', fontName=FONT, fontSize=10, leading=18, textColor=colors.HexColor('#1d4ed8')),
        'footer': ParagraphStyle('footer', fontName=FONT, fontSize=8, textColor=colors.HexColor('#94a3b8')),
    }

def build_pdf():
    output_path = '/Users/oga/Desktop/tsunagu/説明書_ツナグ.pdf'
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm,
    )

    S = make_styles()
    story = []

    # ===== 表紙 =====
    story.append(Spacer(1, 40*mm))
    story.append(Paragraph('ツナグ', S['cover_title']))
    story.append(Paragraph('工場引き継ぎメモアプリ', S['cover_sub']))
    story.append(Spacer(1, 6*mm))
    story.append(HRFlowable(width='100%', thickness=2, color=colors.HexColor('#1d4ed8')))
    story.append(Spacer(1, 6*mm))
    story.append(Paragraph('利用マニュアル', S['cover_sub']))
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph('バージョン 1.0　／　2026年3月', S['cover_meta']))
    story.append(PageBreak())

    # ===== はじめに =====
    story.append(Paragraph('はじめに', S['h1']))
    story.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#e2e8f0')))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        '「ツナグ」は、工場内の引き継ぎ情報をスマートフォン・パソコンから簡単に記録・確認できるアプリです。'
        '紙のノートやLINEでの引き継ぎを、データとして安全に管理できます。',
        S['body']
    ))
    story.append(Spacer(1, 6))

    features = [
        '引き継ぎ内容の登録・確認・編集・削除',
        'カテゴリ・重要度（高／中／低）の分類',
        'コメント機能（追記・質問）',
        'キーワード検索・担当者絞り込み・日付指定',
        '過去の履歴閲覧',
        'アーカイブ機能（完了した引き継ぎを整理）',
        'CSVエクスポート（Excelで開ける）',
    ]
    for f in features:
        story.append(Paragraph(f'・ {f}', S['bullet']))

    story.append(Spacer(1, 8*mm))

    # ===== 目次 =====
    story.append(Paragraph('目　次', S['h1']))
    story.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#e2e8f0')))
    story.append(Spacer(1, 4))
    toc_items = [
        ('1', 'ログイン・アカウント作成'),
        ('2', 'トップページの見かた'),
        ('3', '引き継ぎを登録する'),
        ('4', '引き継ぎを確認済みにする'),
        ('5', 'コメントを追加する'),
        ('6', '検索・絞り込みをする'),
        ('7', '引き継ぎを編集・削除する'),
        ('8', 'アーカイブする'),
        ('9', '過去の履歴を見る'),
        ('10', 'CSVをダウンロードする'),
        ('11', '従業員を管理する'),
        ('12', 'カテゴリを管理する'),
        ('13', 'ログアウトする'),
        ('14', 'よくある質問'),
    ]
    for num, title in toc_items:
        story.append(Paragraph(f'{num}　　{title}', S['toc']))
    story.append(PageBreak())

    # ===== 各章 =====
    chapters = [
        # (章タイトル, [(種別, テキスト), ...])
        # 種別: h2, h3, body, bullet, note, table, hr
        ('1. ログイン・アカウント作成', [
            ('h2', '初めて使う場合（アカウント作成）'),
            ('body', 'アプリのURLをブラウザで開き、ログイン画面下の「新規登録」をタップしてください。'),
            ('table', [
                ['項目', '入力内容'],
                ['会社名', '自社の名前（例：○○製作所）'],
                ['お名前', '管理者の名前'],
                ['メールアドレス', '連絡用のメール'],
                ['パスワード', '8文字以上で設定'],
            ]),
            ('body', '入力後「アカウントを作成」ボタンを押すと、自動的にトップページへ移動します。'),
            ('note', '⚠️ アカウントは1社につき1つ作成してください。従業員の名前は「従業員管理」から追加します。'),
            ('h2', '2回目以降（ログイン）'),
            ('body', 'アプリのURLを開き、メールアドレスとパスワードを入力して「ログイン」ボタンを押してください。'),
        ]),
        ('2. トップページの見かた', [
            ('body', 'ログイン後に表示されるトップページの主な要素は以下のとおりです。'),
            ('table', [
                ['エリア', '内容'],
                ['ヘッダー', 'アプリ名・未確認件数・各管理ページへのリンク'],
                ['アラート', '重要度「高」の未確認がある場合に警告を表示'],
                ['カテゴリフィルター', 'カテゴリで絞り込むボタン'],
                ['検索エリア', 'キーワード・日付・担当者で絞り込み'],
                ['引き継ぎカード', '各引き継ぎの内容・操作ボタン'],
            ]),
        ]),
        ('3. 引き継ぎを登録する', [
            ('body', 'トップページ右上の「＋ 新規登録」ボタンを押して登録画面を開きます。'),
            ('h3', '① 記入者を選ぶ'),
            ('body', '従業員名のボタンをタップして選択してください（青くなったら選択済み）。名前が表示されない場合は「従業員管理」で追加してください。'),
            ('h3', '② カテゴリを選ぶ'),
            ('body', '引き継ぎ内容に合ったカテゴリをタップします（例：設備、安全、品質など）。'),
            ('h3', '③ 重要度を選ぶ'),
            ('table', [
                ['ボタン', '意味'],
                ['高（赤）', '必ず次のシフトで対応が必要'],
                ['中（黄）', 'できれば対応してほしい'],
                ['低（グレー）', '情報共有のみ'],
            ]),
            ('h3', '④ 引き継ぎ内容を入力する'),
            ('body', 'テキストエリアに引き継ぎ内容を自由に入力します。'),
            ('body', '例：「3番ラインのポンプから異音あり。夜間も継続確認してください。」'),
            ('h3', '⑤ 登録する'),
            ('body', '「登録する」ボタンを押すと保存され、トップページに戻ります。'),
        ]),
        ('4. 引き継ぎを確認済みにする', [
            ('body', '引き継ぎカードの右上にあるチェックボックス（□）をタップします。'),
            ('body', 'チェックが入ると「確認済み」と表示され、カードが薄くなります。'),
            ('note', '✅ 確認した引き継ぎにはチェックを入れて、対応済みであることを記録しましょう。'),
        ]),
        ('5. コメントを追加する', [
            ('body', '引き継ぎカード下の「＋ コメントを追加」をタップします。'),
            ('bullet', '① 自分の名前ボタンをタップして選ぶ'),
            ('bullet', '② コメント内容を入力する（例：確認しました。部品の発注をかけます。）'),
            ('bullet', '③「送信」ボタンを押す'),
            ('body', 'コメントは引き継ぎカードに時系列で表示されます。'),
        ]),
        ('6. 検索・絞り込みをする', [
            ('h3', 'キーワード検索'),
            ('body', '入力欄に調べたい言葉を入力すると、その言葉が含まれる引き継ぎだけ表示されます。例：「ポンプ」と入力するとポンプに関する引き継ぎのみ表示。'),
            ('h3', '日付で絞り込む'),
            ('body', '日付欄をタップして見たい日付を選びます。過去の日付を選ぶと、その日の引き継ぎが表示されます。'),
            ('h3', '担当者で絞り込む'),
            ('body', '名前のボタンをタップすると、その人が記入した引き継ぎだけ表示されます。「全員」で全員の引き継ぎが表示されます。'),
            ('h3', 'カテゴリで絞り込む'),
            ('body', 'ページ上部のカテゴリボタンをタップすると、そのカテゴリだけ表示されます。'),
        ]),
        ('7. 引き継ぎを編集・削除する', [
            ('h3', '編集する'),
            ('bullet', '① カード下の「編集」ボタンをタップ'),
            ('bullet', '② テキストエリアが開き、内容を修正できる'),
            ('bullet', '③「保存」で更新、「キャンセル」で取り消し'),
            ('h3', '削除する'),
            ('bullet', '① カード下の「削除」ボタンをタップ'),
            ('bullet', '② 確認メッセージが表示される'),
            ('bullet', '③「OK」を押すと完全に削除される'),
            ('note', '⚠️ 削除したデータは元に戻せません。慎重に操作してください。'),
        ]),
        ('8. アーカイブする', [
            ('body', '対応が完了した引き継ぎや古い記録を「アーカイブ」すると、通常リストから非表示になります。削除とは異なりデータは保存されます。'),
            ('h3', 'アーカイブする'),
            ('body', 'カード下の「アーカイブ」ボタンをタップすると、通常リストから消えます。'),
            ('h3', 'アーカイブ済みを見る'),
            ('body', 'ページ上部の「アーカイブ（件数）」ボタンをタップすると、アーカイブ済み一覧が表示されます。'),
            ('h3', 'アーカイブを解除する'),
            ('body', 'アーカイブ一覧で「アーカイブ解除」ボタンをタップすると、通常リストに戻ります。'),
        ]),
        ('9. 過去の履歴を見る', [
            ('body', 'トップページ下部の「過去の引き継ぎ履歴を見る →」をタップします。'),
            ('bullet', '・ 日付ごとに引き継ぎがまとめて表示される'),
            ('bullet', '・ 各日付の確認済み件数・未確認件数が一目でわかる'),
        ]),
        ('10. CSVをダウンロードする', [
            ('body', '当日の引き継ぎ一覧をExcelで開けるCSV形式でダウンロードできます。'),
            ('bullet', '① トップページ右上の「CSVダウンロード」ボタンをタップ'),
            ('bullet', '② ファイルが自動でダウンロードされる'),
            ('bullet', '③ Excelで開いて印刷・保管できる'),
            ('table', [
                ['日付', 'カテゴリ', '重要度', '内容', '確認済み', '登録時刻'],
                ['2026/03/22', '設備', '高', 'ポンプ異音あり', '済', '12:30'],
            ]),
        ]),
        ('11. 従業員を管理する', [
            ('body', 'ヘッダーの「従業員管理」をタップして管理画面を開きます。'),
            ('h3', '従業員を追加する'),
            ('bullet', '① 名前入力欄に名前を入力する'),
            ('bullet', '②「追加」ボタンを押す'),
            ('note', '⚠️ 名前を入力中にEnterキーを押しても登録されません。必ず「追加」ボタンを押してください。'),
            ('h3', '従業員を削除する'),
            ('body', '一覧の名前の右にある「×」ボタンを押すと削除されます。過去の記録には影響ありません。'),
        ]),
        ('12. カテゴリを管理する', [
            ('body', 'ヘッダーの「カテゴリ管理」をタップして管理画面を開きます。'),
            ('h3', 'カテゴリを追加する'),
            ('bullet', '① カテゴリ名を入力する（例：電気、部品）'),
            ('bullet', '②「追加」ボタンを押す'),
            ('h3', 'カテゴリを削除する'),
            ('body', '一覧の「×」ボタンを押すと削除されます。過去の記録には影響ありません。'),
        ]),
        ('13. ログアウトする', [
            ('body', 'ヘッダー右端の「ログアウト」をタップするとログイン画面に戻ります。'),
            ('note', '共有パソコンで使用する場合は、使用後にログアウトすることをおすすめします。'),
        ]),
        ('14. よくある質問', [
            ('h3', 'Q. スマートフォンでも使えますか？'),
            ('body', 'A. はい。スマートフォンのブラウザ（Safari・Chrome）でURLを開けば使えます。ホーム画面に追加するとアプリのように使えます。'),
            ('h3', 'Q. データは消えませんか？'),
            ('body', 'A. インターネット上のデータベースに保存されるため、端末が変わってもデータは残ります。'),
            ('h3', 'Q. 複数人が同時に使えますか？'),
            ('body', 'A. はい。複数人が同時に使っても問題ありません。ページをリロードすると最新の情報が表示されます。'),
            ('h3', 'Q. 他の会社のデータは見えますか？'),
            ('body', 'A. 見えません。会社ごとにデータが完全に分離されています。'),
            ('h3', 'Q. 引き継ぎを間違えて登録してしまいました'),
            ('body', 'A.「編集」ボタンで内容を修正するか、「削除」ボタンで削除してください。'),
            ('h3', 'Q. パスワードを忘れた場合は？'),
            ('body', 'A. 現在はパスワードリセット機能がありません。導入担当者にご連絡ください。'),
        ]),
    ]

    table_header_style = TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1d4ed8')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,-1), FONT),
        ('FONTSIZE', (0,0), (-1,0), 10),
        ('FONTSIZE', (0,1), (-1,-1), 9),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f8fafc'), colors.white]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ])

    for ch_title, items in chapters:
        story.append(Paragraph(ch_title, S['h1']))
        story.append(HRFlowable(width='100%', thickness=2, color=colors.HexColor('#1d4ed8')))
        story.append(Spacer(1, 4))

        for kind, content in items:
            if kind == 'h2':
                story.append(Paragraph(content, S['h2']))
            elif kind == 'h3':
                story.append(Paragraph(content, S['h3']))
            elif kind == 'body':
                story.append(Paragraph(content, S['body']))
            elif kind == 'bullet':
                story.append(Paragraph(content, S['bullet']))
            elif kind == 'note':
                story.append(Paragraph(content, S['note']))
                story.append(Spacer(1, 2))
            elif kind == 'table':
                col_count = len(content[0])
                available_width = 170*mm
                col_width = available_width / col_count
                col_widths = [col_width] * col_count

                table_data = [
                    [Paragraph(str(cell), ParagraphStyle('tc', fontName=FONT, fontSize=9, leading=13, textColor=colors.white if r==0 else colors.HexColor('#1e293b')))
                     for cell in row]
                    for r, row in enumerate(content)
                ]
                t = Table(table_data, colWidths=col_widths)
                t.setStyle(table_header_style)
                story.append(t)
                story.append(Spacer(1, 6))

        story.append(Spacer(1, 6*mm))

    # ===== フッター =====
    story.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#e2e8f0')))
    story.append(Spacer(1, 4))
    story.append(Paragraph('ツナグ 利用マニュアル v1.0　　ご不明な点は導入担当者までご連絡ください。', S['footer']))

    doc.build(story)
    print(f'PDF生成完了: {output_path}')

build_pdf()
