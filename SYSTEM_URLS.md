# 輝旅 島専科（KIRATABI SHIMASENKA）全URL完全一覧

最終更新: 2026-11-09

---

## 1. 一般公開サイト（旅行者・ユーザー向けURL）

| ページ名称 | 本番URL | 説明 |
| :--- | :--- | :--- |
| **トップページ** | [https://island.kira-tabi.com/](https://island.kira-tabi.com/) | メインポータル・検索・諸島ガイド・特集 |
| **全国離島マップ（2D）** | [https://island.kira-tabi.com/map](https://island.kira-tabi.com/map) | 全国481島ピン表示・現在地GPS到達チェックイン |
| **3D地球儀モード** | [https://island.kira-tabi.com/globe](https://island.kira-tabi.com/globe) | 3Dグローブでの日本の離島俯瞰ビュー |
| **全国離島一覧ディレクトリ** | [https://island.kira-tabi.com/islands](https://island.kira-tabi.com/islands) | 全481島（制覇対象369島＋制限・参照112島）のエリア別一覧 |
| **各離島 詳細ページ（全369島）** | `https://island.kira-tabi.com/island/[スラッグまたはID]`<br>例: [https://island.kira-tabi.com/island/hachijojima](https://island.kira-tabi.com/island/hachijojima)<br>例: [https://island.kira-tabi.com/island/ishigakijima](https://island.kira-tabi.com/island/ishigakijima)<br>例: [https://island.kira-tabi.com/island/oujima_nago](https://island.kira-tabi.com/island/oujima_nago) | 各島の現地検証写真・航路・宿・Wi-Fi・天気・島ノート・アフィリエイト導線 |
| **各諸島エリア特集（全45エリア）** | `https://island.kira-tabi.com/region/[エリアID]` | 諸島ごとの所属離島一覧・エリア解説（下部に全45URL記載） |
| **AIアイランドホッピング旅程作成** | [https://island.kira-tabi.com/route-planner](https://island.kira-tabi.com/route-planner) | 出発地・日数・希望からAIが現実的な航路プランを生成 |
| **AI離島コンシェルジュ・相棒** | [https://island.kira-tabi.com/companion](https://island.kira-tabi.com/companion) | 対話型AI相談＆育成コンパニオン |
| **ご当地妖精図鑑** | [https://island.kira-tabi.com/fairy-gallery](https://island.kira-tabi.com/fairy-gallery) | 全国172体のご当地妖精コレクション図鑑 |
| **離島制覇ランキング** | [https://island.kira-tabi.com/ranking](https://island.kira-tabi.com/ranking) | 全国ユーザーの到達数・XPランキング |
| **島ノート（上陸タイムライン）** | [https://island.kira-tabi.com/timeline](https://island.kira-tabi.com/timeline) | 写真付き上陸日記・口コミタイムライン |
| **離島旅の持ち物チェックリスト** | [https://island.kira-tabi.com/packing-list](https://island.kira-tabi.com/packing-list) | 船酔い対策・現金準備など離島特有の持ち物管理 |
| **GPSチェックイン画面** | [https://island.kira-tabi.com/checkin](https://island.kira-tabi.com/checkin) | 現地GPS判定による上陸認証（個別: `/checkin/[id]`） |
| **マイページ（ログイン・証明書管理）** | [https://island.kira-tabi.com/mypage](https://island.kira-tabi.com/mypage) | 獲得証明書・サブスク管理・プロモコード引換 |
| **直予約：宿泊施設詳細** | `https://island.kira-tabi.com/stay/[施設ID]` | 島宿の直予約・詳細ページ |
| **直予約：アクティビティ詳細** | `https://island.kira-tabi.com/activity/[ID]` | 島内ツアー・体験の詳細ページ |
| **直予約：レンタカー・移動手段** | `https://island.kira-tabi.com/rental/[ID]` | 島内レンタカー・レンタサイクル詳細 |
| **決済完了 / キャンセル画面** | `https://island.kira-tabi.com/order/success`<br>`https://island.kira-tabi.com/order/cancel` | Stripe決済完了後のサンクス画面・確認画面 |
| **認証コールバック** | `https://island.kira-tabi.com/auth/callback` | Googleログイン / マジックリンク認証コールバック |
| **お問い合わせ・掲載相談** | [https://island.kira-tabi.com/contact](https://island.kira-tabi.com/contact) | ユーザー問い合わせ・自治体/事業者連携フォーム |
| **利用規約** | [https://island.kira-tabi.com/terms](https://island.kira-tabi.com/terms) | サービス利用規約 |
| **プライバシーポリシー** | [https://island.kira-tabi.com/privacy](https://island.kira-tabi.com/privacy) | 個人情報保護方針 |
| **特定商取引法に基づく表記** | [https://island.kira-tabi.com/tokushoho](https://island.kira-tabi.com/tokushoho) | 決済・有料プラン・物理証明書に関する法定表記 |

---

## 2. 運営管理ダッシュボード ＆ 宿泊施設B2BポータルURL（ステルス保護済）

> [!IMPORTANT]
> 一般訪問者が `island.kira-tabi.com` の通常パスへアクセスしてもエッジ層で `404 Not Found` として完全遮断されます。
> オーナー様は下記 **「① 今すぐ使える秘密鍵アンロックURL（`?vault_key=kira9f2a`）」** を開くことで、30日間有効な暗号化 `HttpOnly` Cookieがブラウザにセットされ、DNS設定前でも即座にアクセス可能です。

| システム名称 | ① 今すぐ使える秘密鍵アンロックURL（現行ドメイン） | ② DNS設定後の専用ドメインURL |
| :--- | :--- | :--- |
| **運営管理ダッシュボード**<br>（全16タブ・写真一括登録・注文管理） | [https://island.kira-tabi.com/kira-system-panel-9f2?vault_key=kira9f2a](https://island.kira-tabi.com/kira-system-panel-9f2?vault_key=kira9f2a) | `https://ops-vault-9f2a.kira-tabi.com/` |
| **宿泊施設B2Bポータル（ログイン）** | [https://island.kira-tabi.com/biz-portal-secure-8f92a1b3/login?vault_key=kira9f2a](https://island.kira-tabi.com/biz-portal-secure-8f92a1b3/login?vault_key=kira9f2a) | `https://partner.kira-tabi.com/login` |
| **宿泊施設B2B（ダッシュボード）** | [https://island.kira-tabi.com/biz-portal-secure-8f92a1b3/dashboard?vault_key=kira9f2a](https://island.kira-tabi.com/biz-portal-secure-8f92a1b3/dashboard?vault_key=kira9f2a) | `https://partner.kira-tabi.com/dashboard` |
| **宿泊施設B2B（施設情報編集）** | [https://island.kira-tabi.com/biz-portal-secure-8f92a1b3/facility?vault_key=kira9f2a](https://island.kira-tabi.com/biz-portal-secure-8f92a1b3/facility?vault_key=kira9f2a) | `https://partner.kira-tabi.com/facility` |
| **宿泊施設B2B（予約管理）** | [https://island.kira-tabi.com/biz-portal-secure-8f92a1b3/reservations?vault_key=kira9f2a](https://island.kira-tabi.com/biz-portal-secure-8f92a1b3/reservations?vault_key=kira9f2a) | `https://partner.kira-tabi.com/reservations` |
| **宿泊施設B2B（オンライン宿泊台帳）** | [https://island.kira-tabi.com/biz-portal-secure-8f92a1b3/ledger?vault_key=kira9f2a](https://island.kira-tabi.com/biz-portal-secure-8f92a1b3/ledger?vault_key=kira9f2a) | `https://partner.kira-tabi.com/ledger` |

---

## 3. SEO・検索エンジン・PWA関連URL

| 名称 | 本番URL | 用途 |
| :--- | :--- | :--- |
| **XMLサイトマップ** | [https://island.kira-tabi.com/sitemap.xml](https://island.kira-tabi.com/sitemap.xml) | Google Search Console 登録用（全390 URL自動生成） |
| **クローラー制御 (robots.txt)** | [https://island.kira-tabi.com/robots.txt](https://island.kira-tabi.com/robots.txt) | 検索エンジンの巡回許可＆管理パス除外指定 |
| **PWA Web App Manifest** | [https://island.kira-tabi.com/manifest.json](https://island.kira-tabi.com/manifest.json) | スマホの「ホーム画面に追加」アプリ化定義ファイル |

---

## 4. 全45諸島エリア特集ページURL一覧

| 地方 | 諸島・エリア名 | 本番URL |
| :--- | :--- | :--- |
| **北海道** | 北の大地の島々 | [https://island.kira-tabi.com/region/pseudo_hokkaido](https://island.kira-tabi.com/region/pseudo_hokkaido) |
| **東北** | 三陸海岸の離島 | [https://island.kira-tabi.com/region/pseudo_sanriku](https://island.kira-tabi.com/region/pseudo_sanriku) |
| **東北** | 奥州・牡鹿の島々 | [https://island.kira-tabi.com/region/oshika](https://island.kira-tabi.com/region/oshika) |
| **関東** | 伊豆諸島 | [https://island.kira-tabi.com/region/izu](https://island.kira-tabi.com/region/izu) |
| **関東** | 小笠原諸島 | [https://island.kira-tabi.com/region/ogasawara](https://island.kira-tabi.com/region/ogasawara) |
| **関東** | 首都圏近海の離島 | [https://island.kira-tabi.com/region/pseudo_kanto](https://island.kira-tabi.com/region/pseudo_kanto) |
| **北陸** | 日本海・北陸の島々 | [https://island.kira-tabi.com/region/pseudo_hokuriku](https://island.kira-tabi.com/region/pseudo_hokuriku) |
| **東海** | 三河湾の島々 | [https://island.kira-tabi.com/region/aichi_santo](https://island.kira-tabi.com/region/aichi_santo) |
| **近畿** | 家島群島 | [https://island.kira-tabi.com/region/ieshima](https://island.kira-tabi.com/region/ieshima) |
| **近畿** | 播磨灘の島々 | [https://island.kira-tabi.com/region/pseudo_awaji](https://island.kira-tabi.com/region/pseudo_awaji) |
| **近畿** | 琵琶湖に浮かぶ島々 | [https://island.kira-tabi.com/region/pseudo_biwako](https://island.kira-tabi.com/region/pseudo_biwako) |
| **中国** | 備讃瀬戸の島々 | [https://island.kira-tabi.com/region/kasaoka](https://island.kira-tabi.com/region/kasaoka) |
| **中国** | 響灘・長門の島々 | [https://island.kira-tabi.com/region/hagi](https://island.kira-tabi.com/region/hagi) |
| **中国** | 隠岐諸島 | [https://island.kira-tabi.com/region/oki](https://island.kira-tabi.com/region/oki) |
| **中国** | 山陰海岸の島々 | [https://island.kira-tabi.com/region/pseudo_san_in](https://island.kira-tabi.com/region/pseudo_san_in) |
| **中国** | 防予諸島の島々 | [https://island.kira-tabi.com/region/suo_oshima](https://island.kira-tabi.com/region/suo_oshima) |
| **四国** | 忽那諸島 | [https://island.kira-tabi.com/region/kutsuna](https://island.kira-tabi.com/region/kutsuna) |
| **四国** | 上島諸島 | [https://island.kira-tabi.com/region/kamijima](https://island.kira-tabi.com/region/kamijima) |
| **四国** | 直島・小豆島（瀬戸内アート） | [https://island.kira-tabi.com/region/naoshima](https://island.kira-tabi.com/region/naoshima) |
| **四国** | 塩飽諸島 | [https://island.kira-tabi.com/region/shiwaku](https://island.kira-tabi.com/region/shiwaku) |
| **四国** | 宇和海周辺 | [https://island.kira-tabi.com/region/uwakai](https://island.kira-tabi.com/region/uwakai) |
| **四国** | 阿波の島々 | [https://island.kira-tabi.com/region/pseudo_tokushima](https://island.kira-tabi.com/region/pseudo_tokushima) |
| **四国** | 土佐湾の島々 | [https://island.kira-tabi.com/region/pseudo_tosa](https://island.kira-tabi.com/region/pseudo_tosa) |
| **九州** | 天草諸島 | [https://island.kira-tabi.com/region/amakusa](https://island.kira-tabi.com/region/amakusa) |
| **九州** | 奄美群島 | [https://island.kira-tabi.com/region/amami](https://island.kira-tabi.com/region/amami) |
| **九州** | 豊後水道の島々 | [https://island.kira-tabi.com/region/bungo](https://island.kira-tabi.com/region/bungo) |
| **九州** | 博多湾・筑前の島々 | [https://island.kira-tabi.com/region/chikuzen](https://island.kira-tabi.com/region/chikuzen) |
| **九州** | 玄界灘の島々 | [https://island.kira-tabi.com/region/genkai](https://island.kira-tabi.com/region/genkai) |
| **九州** | 五島列島 | [https://island.kira-tabi.com/region/goto](https://island.kira-tabi.com/region/goto) |
| **九州** | 平戸・松浦の島々 | [https://island.kira-tabi.com/region/hirado](https://island.kira-tabi.com/region/hirado) |
| **九州** | 壱岐諸島 | [https://island.kira-tabi.com/region/iki](https://island.kira-tabi.com/region/iki) |
| **九州** | 日向灘の島々 | [https://island.kira-tabi.com/region/minami_naka](https://island.kira-tabi.com/region/minami_naka) |
| **九州** | トカラ列島 | [https://island.kira-tabi.com/region/tokara](https://island.kira-tabi.com/region/tokara) |
| **九州** | 対馬 | [https://island.kira-tabi.com/region/tsushima](https://island.kira-tabi.com/region/tsushima) |
| **九州** | 大隅群島 | [https://island.kira-tabi.com/region/osumi](https://island.kira-tabi.com/region/osumi) |
| **九州** | 甑島列島 | [https://island.kira-tabi.com/region/koshiki](https://island.kira-tabi.com/region/koshiki) |
| **九州** | 天草灘の島々 | [https://island.kira-tabi.com/region/pseudo_nagashima](https://island.kira-tabi.com/region/pseudo_nagashima) |
| **九州** | 西海国立公園の島々 | [https://island.kira-tabi.com/region/pseudo_saikai](https://island.kira-tabi.com/region/pseudo_saikai) |
| **九州** | 薩摩半島の島々 | [https://island.kira-tabi.com/region/pseudo_satsuma](https://island.kira-tabi.com/region/pseudo_satsuma) |
| **沖縄** | 大東諸島 | [https://island.kira-tabi.com/region/daito](https://island.kira-tabi.com/region/daito) |
| **沖縄** | 慶良間諸島 | [https://island.kira-tabi.com/region/kerama](https://island.kira-tabi.com/region/kerama) |
| **沖縄** | 宮古列島 | [https://island.kira-tabi.com/region/miyako](https://island.kira-tabi.com/region/miyako) |
| **沖縄** | 沖縄本島周辺離島 | [https://island.kira-tabi.com/region/okinawa_main](https://island.kira-tabi.com/region/okinawa_main) |
| **沖縄** | 八重山諸島 | [https://island.kira-tabi.com/region/yaeyama](https://island.kira-tabi.com/region/yaeyama) |
| **沖縄** | 久米島周辺の島々 | [https://island.kira-tabi.com/region/kume](https://island.kira-tabi.com/region/kume) |

---

## 5. バックエンドAPI エンドポイント全50本一覧

### 5-1. 公開・ユーザー・決済・Webhook系API（20本）

| メソッド | エンドポイントURL | 用途 |
| :---: | :--- | :--- |
| `POST` | `https://island.kira-tabi.com/api/ai-recommend` | AI島コンシェルジュ診断・推薦 |
| `POST` | `https://island.kira-tabi.com/api/ai-route` | AIアイランドホッピング旅程作成 |
| `GET` | `https://island.kira-tabi.com/api/weather` | 島座標のリアルタイム気象・波浪アラート取得 |
| `GET` | `https://island.kira-tabi.com/api/islands/[id]/wifi-spots` | 島別フリーWi-Fi・キャリア電波目安取得 |
| `GET/POST` | `https://island.kira-tabi.com/api/certificates` | デジタル上陸証明書の発行・取得 |
| `POST` | `https://island.kira-tabi.com/api/certificates/anniversary` | 記念節目の特別デジタル証明書生成 |
| `POST` | `https://island.kira-tabi.com/api/order/checkout` | 物理証明書フレームのStripe決済セッション作成 |
| `GET` | `https://island.kira-tabi.com/api/order/verify` | Stripe決済完了確認 |
| `POST` | `https://island.kira-tabi.com/api/order` | 物理証明書オーダー登録 |
| `GET` | `https://island.kira-tabi.com/api/orders` | ログインユーザーの注文履歴取得 |
| `POST` | `https://island.kira-tabi.com/api/subscription/checkout` | プレミアム/アルティメット会員Stripe決済作成 |
| `POST` | `https://island.kira-tabi.com/api/subscription/change-plan` | サブスクリプションプラン変更 |
| `POST` | `https://island.kira-tabi.com/api/subscription/portal` | Stripeカスタマーポータル起動 |
| `POST` | `https://island.kira-tabi.com/api/webhooks/stripe` | **Stripe本番Webhook受信エンドポイント** |
| `GET/PUT` | `https://island.kira-tabi.com/api/user/profile` | ユーザープロフィール取得・更新 |
| `POST` | `https://island.kira-tabi.com/api/user/redeem-code` | プロモーションコード・特典引換 |
| `POST` | `https://island.kira-tabi.com/api/user/delete` | 退会・アカウント削除処理 |
| `POST` | `https://island.kira-tabi.com/api/upload` | ユーザー島ノート写真アップロード |
| `POST` | `https://island.kira-tabi.com/api/contact` | お問い合わせ送信 |
| `POST` | `https://island.kira-tabi.com/api/report` | 不適切投稿の通報 |

### 5-2. 運営管理専用API（30本・要管理者トークン＆エッジ保護済）

| メソッド | エンドポイントパス | 用途 |
| :---: | :--- | :--- |
| `POST` | `/api/admin/verify-login` | 管理者認証・UUIDセッショントークン発行（ブルートフォース防御付） |
| `POST` | `/api/admin/login` | レガシー互換管理者認証 |
| `POST` | `/api/admin/change-password` | マスター＆スタッフ管理者パスワード変更 |
| `GET` | `/api/admin/dashboard-stats` | 経営KPI・会員数・売上・465島集計取得 |
| `GET/PUT` | `/api/admin/islands` | 全465島マスター＆現地写真（横/縦/ピント）更新 |
| `POST` | `/api/admin/upload` | 管理画面からのStorage画像アップロード（`islands`, `fairies`, `public-assets`） |
| `GET/PUT` | `/api/admin/orders` | 物理証明書注文一覧・発送ステータス更新 |
| `GET/PUT` | `/api/admin/official-certificates` | 島別の公式デジタル証明書デザイン・公印・価格設定 |
| `GET/PUT` | `/api/admin/certificate-requests` | 証明書発行リクエスト管理 |
| `GET` | `/api/admin/list-users` | 全登録ユーザー一覧取得 |
| `POST` | `/api/admin/find-user` | メールアドレス・IDによるユーザー検索 |
| `GET` | `/api/admin/user-details` | 個別ユーザーの詳細・到達島・決済状況取得 |
| `POST` | `/api/admin/grant-premium` | プレミアム/アルティメット会員権限の手動付与 |
| `POST` | `/api/admin/grant-tickets` | 高画質証明書チケット枚数の付与・上書き |
| `POST` | `/api/admin/grant-visit` | 特定ユーザーへの離島到達実績の手動付与 |
| `GET` | `/api/admin/list-diaries` | 島ノート（口コミ日記）一覧取得 |
| `POST` | `/api/admin/moderate-diary` | 島ノートの非表示化・削除・公式日記投稿 |
| `GET/POST/PUT` | `/api/admin/fairies` | 全国172体のご当地妖精マスター管理 |
| `POST` | `/api/admin/generate-fairy` | Gemini AIによるご当地妖精キャラクター自動生成 |
| `POST` | `/api/admin/generate-post` | Gemini AIによる公式島ノート下書き自動生成 |
| `GET/POST/PUT/DELETE` | `/api/admin/wifi-spots` | 全国351島の公共Wi-Fiスポット＆キャリア電波目安管理 |
| `GET/POST/DELETE` | `/api/admin/agent-reviews` | 島プロ評価・宿オーナー向けコンサルレポート管理 |
| `GET/POST/PUT/DELETE` | `/api/admin/partners` | B2Bタイアップ広告・バナー出稿管理 |
| `GET/POST/PUT/DELETE` | `/api/admin/distributors` | 島内特約店・協力店舗・店頭POP QR管理 |
| `GET/POST/PUT/DELETE` | `/api/admin/promo-codes` | アプリ内特典プロモーションコード管理 |
| `GET/POST/PUT/DELETE` | `/api/admin/coupons` | 割引クーポン発行・管理 |
| `GET/POST` | `/api/admin/newsletter` | 会員向けメルマガ配信・履歴管理 |
| `GET/PUT` | `/api/admin/contacts` | お問い合わせ一覧・対応ステータス管理 |
| `GET/POST/PUT/DELETE` | `/api/admin/users` | 自治体・スタッフ別RBACアカウント管理 |
| `GET` | `/api/admin/audit-logs` | 全管理操作の改ざん防止・監査ログ閲覧 |

---

## 6. 外部インフラ・管理コンソールURL一覧

| サービス名 | 管理画面URL | 用途 |
| :--- | :--- | :--- |
| **GitHub** | [https://github.com/famireliance/travel_app_v2](https://github.com/famireliance/travel_app_v2) | ソースコード管理・本番デプロイ連携リポジトリ |
| **Supabase** | [https://supabase.com/dashboard/project/lpuxsjpdenrwzyxfnggo](https://supabase.com/dashboard/project/lpuxsjpdenrwzyxfnggo) | 本番PostgreSQLデータベース・Auth・Storageバケット管理 |
| **Vercel** | [https://vercel.com/dashboard](https://vercel.com/dashboard) | 本番ホスティング・カスタムドメイン・環境変数管理 |
| **Stripe** | [https://dashboard.stripe.com/](https://dashboard.stripe.com/) | 本番売上・サブスクリプション・Webhook管理 |
| **Google Search Console** | [https://search.google.com/search-console](https://search.google.com/search-console) | `sitemap.xml` 送信・Google検索パフォーマンス確認 |
