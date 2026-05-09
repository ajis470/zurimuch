import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'プライバシーポリシー｜オカズマッチ' },
  alternates: {
    canonical: 'https://zurimuch.com/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
            オカズ<span className="text-rose-500">マッチ</span>
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">プライバシーポリシー</h1>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">アフィリエイト広告について</h2>
            <p>
              当サイト「オカズマッチ」は、FANZAアフィリエイトプログラムに参加しており、
              女優の作品リンクや関連リンクを通じて収益を得ています。
              ユーザーがリンクをクリックしてFANZA（DMM）で購入・レンタルを行った場合に、
              当サイトに報酬が発生する場合があります。
              掲載情報はFANZA Webサービス（DMM Web API）を利用して取得しています。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">アクセス解析について</h2>
            <p>
              当サイトはGoogle Analytics 4（GA4）を使用してアクセス解析を行っています。
              GA4はCookieを使用してデータを収集しますが、個人を特定する情報は収集しません。
              データの収集を希望しない場合は、ブラウザの設定からCookieを無効にしてください。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Cookieについて</h2>
            <p>
              当サイトはGoogle Analyticsによるアクセス解析のためにCookieを使用しています。
              Cookieはブラウザの設定から無効にすることができます。
              Cookieを無効にしても、当サイトの閲覧には影響ありません。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">個人情報の取り扱い</h2>
            <p>
              当サイトは、ユーザーが入力した女優名の検索キーワードをサーバーに送信しますが、
              個人を特定する情報として保存・管理することはありません。
              ユーザーの個人情報を第三者に提供することはありません。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">免責事項</h2>
            <p>
              当サイトのコンテンツおよびリンク先の情報については、
              正確性・最新性を保つよう努めていますが、
              その内容を保証するものではありません。
              当サイトを利用したことによる損害について、
              当サイトは一切の責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">プライバシーポリシーの変更</h2>
            <p>
              当サイトは、必要に応じてプライバシーポリシーを変更することがあります。
              変更後のプライバシーポリシーは、当ページに掲載した時点で効力を生じるものとします。
            </p>
          </section>

          <p className="text-xs text-gray-400 pt-2">制定日：2026年5月9日</p>
        </div>
      </div>

      <footer className="text-center py-6">
        <p className="text-xs text-gray-300">
          Powered by{' '}
          <a
            href="https://affiliate.dmm.com/api/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-400 transition-colors"
          >
            FANZA Webサービス
          </a>
          　｜
          <Link href="/privacy" className="underline hover:text-gray-400 transition-colors">
            プライバシーポリシー
          </Link>
        </p>
      </footer>
    </div>
  );
}
